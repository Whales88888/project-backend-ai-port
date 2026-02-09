import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AddPetDialog } from "./AddPetDialog";
import { useState } from "react";

const appointmentSchema = z.object({
  petId: z.string().min(1, "Vui lòng chọn thú cưng"),
  customerId: z.string().min(1, "Vui lòng chọn khách hàng"),
  appointmentDate: z.string().min(1, "Ngày hẹn là bắt buộc"),
  appointmentTime: z.string().optional(),
  appointmentPeriod: z.string().min(1, "Buổi hẹn là bắt buộc"),
  appointmentType: z.string().min(1, "Loại dịch vụ là bắt buộc"),
  status: z.string().min(1, "Trạng thái là bắt buộc"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAppointmentDialog({ open, onOpenChange }: AddAppointmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddPet, setShowAddPet] = useState(false);

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      petId: "",
      customerId: "",
      appointmentDate: "",
      appointmentTime: "",
      appointmentPeriod: "",
      appointmentType: "",
      status: "pending",
      notes: "",
    },
  });

  const selectedCustomerId = form.watch("customerId");

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["/api/pets", { customerId: selectedCustomerId }],
    enabled: !!selectedCustomerId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!data.petId || !data.customerId || !data.appointmentDate || !data.appointmentPeriod || !data.appointmentType) {
        throw new Error("Vui lòng điền đầy đủ thông tin bắt buộc");
      }
      
      // Map period to time range
      let hour = 9; // Default to 9 AM
      if (data.appointmentPeriod === "morning") {
        hour = 9; // Sáng: 9:00
      } else if (data.appointmentPeriod === "afternoon") {
        hour = 14; // Chiều: 14:00
      } else if (data.appointmentPeriod === "evening") {
        hour = 18; // Tối: 18:00
      }
      
      // Use provided time if available, otherwise use default from period
      let formattedTime = `${hour.toString().padStart(2, '0')}:00`;
      if (data.appointmentTime) {
        const timeParts = data.appointmentTime.split(':');
        formattedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1]?.padStart(2, '0') || '00'}`;
      }
      
      const dateTime = new Date(`${data.appointmentDate}T${formattedTime}`);
      
      // Validate date-time is valid (but don't check for past dates)
      if (isNaN(dateTime.getTime())) {
        throw new Error("Ngày và giờ hẹn không hợp lệ");
      }
      
      const payload = {
        petId: data.petId.trim(),
        customerId: data.customerId.trim(),
        appointmentDate: dateTime.toISOString(),
        appointmentType: data.appointmentType.trim(),
        status: data.status || "pending",
        notes: data.notes || null,
      };
      
      console.log("Creating appointment with payload:", payload);
      console.log("Formatted date-time:", dateTime.toISOString());
      
      const res = await apiRequest("POST", "/api/appointments", payload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to create appointment");
      }
      return await res.json();
    },
    onSuccess: async (created) => {
      console.log("Appointment created successfully:", created);
      
      // Calculate the date key for the created appointment (normalized to start of day)
      // Use same logic as AppointmentCalendar to ensure exact match
      let appointmentDateKey: string | undefined;
      let appointmentsUrl: string | undefined;
      
      if (created?.appointmentDate) {
        const appointmentDate = new Date(created.appointmentDate);
        const year = appointmentDate.getFullYear();
        const month = appointmentDate.getMonth();
        const day = appointmentDate.getDate();
        const dateKey = new Date(year, month, day, 0, 0, 0, 0);
        appointmentDateKey = dateKey.toISOString();
        appointmentsUrl = `/api/appointments?date=${encodeURIComponent(appointmentDateKey)}`;
        
        console.log("AddAppointmentDialog - appointmentDateKey:", appointmentDateKey);
        console.log("AddAppointmentDialog - appointmentsUrl:", appointmentsUrl);
      }
      
      // Optimistic update: Add appointment to cache immediately for better UX
      if (appointmentsUrl) {
        queryClient.setQueryData<any[]>([appointmentsUrl], (old) => {
          console.log("Optimistic update - old data:", old);
          if (!old) {
            console.log("Optimistic update - no old data, returning [created]");
            return [created];
          }
          // Check if already exists to avoid duplicates
          const exists = old.some((apt: any) => apt.id === created.id);
          if (exists) {
            console.log("Optimistic update - appointment already exists");
            return old;
          }
          // Add new appointment and sort by time
          const updated = [created, ...old];
          updated.sort((a, b) => {
            const timeA = new Date(a.appointmentDate).getTime();
            const timeB = new Date(b.appointmentDate).getTime();
            return timeA - timeB;
          });
          console.log("Optimistic update - updated data:", updated);
          return updated;
        });
      }
      
      // Show toast immediately
      toast({
        title: "Thành công",
        description: "Đã tạo lịch hẹn mới",
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Invalidate all appointment queries
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"], exact: false });
      
      // Force immediate refetch of the specific date query
      if (appointmentsUrl) {
        await queryClient.refetchQueries({ 
          queryKey: [appointmentsUrl],
          exact: true 
        });
        console.log("Force refetched query:", appointmentsUrl);
      }
      
      // Also refetch all appointment queries in background
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/appointments"], exact: false });
      }, 200);
    },
    onError: (err: any) => {
      console.error("Error creating appointment:", err);
      let msg = err?.message || "Không thể tạo lịch hẹn";
      // Inline mapping
      if (/thú cưng.*lịch/i.test(msg)) {
        form.setError("appointmentTime", { message: "Thú cưng đã có lịch tại khung giờ này" });
      }
      if (/bác sĩ.*khung giờ/i.test(msg)) {
        form.setError("appointmentTime", { message: "Khung giờ đã được đặt cho bác sĩ" });
      }
      if (/quá khứ/i.test(msg)) {
        form.setError("appointmentDate", { message: msg });
        form.setError("appointmentTime", { message: msg });
      }
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    console.log("Form submitted with data:", data);
    if (!data.petId || !data.customerId || !data.appointmentDate || !data.appointmentPeriod || !data.appointmentType) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Đặt lịch hẹn mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">Khách hàng *</Label>
            <Select
              value={form.watch("customerId")}
              onValueChange={(value) => {
                form.setValue("customerId", value, { shouldValidate: true });
                form.setValue("petId", ""); // Reset pet selection
              }}
            >
              <SelectTrigger data-testid="select-customer">
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="petId">Thú cưng *</Label>
            <Select
              value={form.watch("petId")}
              onValueChange={(value) => {
                form.setValue("petId", value, { shouldValidate: true });
              }}
              disabled={!selectedCustomerId}
            >
              <SelectTrigger data-testid="select-pet">
                <SelectValue placeholder={selectedCustomerId ? "Chọn thú cưng" : "Chọn khách hàng trước"} />
              </SelectTrigger>
              <SelectContent>
                {pets.map((pet: any) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name} - {pet.species}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomerId && (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setShowAddPet(true)}>
                  + Thêm thú cưng mới
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Ngày hẹn *</Label>
              <Input
                id="appointmentDate"
                type="date"
                {...form.register("appointmentDate")}
                data-testid="input-appointment-date"
              />
              {form.formState.errors.appointmentDate && (
                <p className="text-sm text-destructive">{form.formState.errors.appointmentDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentPeriod">Buổi hẹn *</Label>
              <Select
                value={form.watch("appointmentPeriod")}
                onValueChange={(value) => {
                  form.setValue("appointmentPeriod", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger data-testid="select-period">
                  <SelectValue placeholder="Chọn buổi hẹn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Sáng</SelectItem>
                  <SelectItem value="afternoon">Chiều</SelectItem>
                  <SelectItem value="evening">Tối</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.appointmentPeriod && (
                <p className="text-sm text-destructive">{form.formState.errors.appointmentPeriod.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointmentTime">Giờ hẹn (tùy chọn)</Label>
            <Input
              id="appointmentTime"
              type="time"
              {...form.register("appointmentTime")}
              data-testid="input-appointment-time"
              placeholder="Để trống sẽ dùng giờ mặc định của buổi"
            />
            <p className="text-xs text-muted-foreground">
              Có thể chọn giờ cụ thể hoặc để trống (mặc định: Sáng 9:00, Chiều 14:00, Tối 18:00)
            </p>
            {form.formState.errors.appointmentTime && (
              <p className="text-sm text-destructive">{form.formState.errors.appointmentTime.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentType">Loại dịch vụ *</Label>
              <Select
                value={form.watch("appointmentType")}
                onValueChange={(value) => {
                  form.setValue("appointmentType", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger data-testid="select-service">
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Khám định kỳ">Khám định kỳ</SelectItem>
                  <SelectItem value="Tiêm phòng">Tiêm phòng</SelectItem>
                  <SelectItem value="Cấp cứu">Cấp cứu</SelectItem>
                  <SelectItem value="Phẫu thuật">Phẫu thuật</SelectItem>
                  <SelectItem value="Tái khám">Tái khám</SelectItem>
                  <SelectItem value="Chăm sóc">Chăm sóc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái *</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => {
                  form.setValue("status", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              rows={3}
              placeholder="Ghi chú thêm về cuộc hẹn..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-appointment">
              {createMutation.isPending ? "Đang lưu..." : "Đặt lịch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AddPetDialog
        open={showAddPet}
        onOpenChange={(o) => {
          setShowAddPet(o);
          if (!o) {
            // Sau khi đóng dialog thêm pet, reload danh sách pet
            queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
          }
        }}
        customerId={selectedCustomerId || undefined}
      />
    </Dialog>
  );
}
