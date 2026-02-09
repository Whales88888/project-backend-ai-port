import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const customerSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Số điện thoại phải gồm 10 chữ số"),
  address: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
}

export function EditCustomerDialog({ open, onOpenChange, customer }: EditCustomerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const res = await apiRequest("PATCH", `/api/customers/${customer.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Thành công", description: "Đã cập nhật khách hàng" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      let raw = err?.message as string | undefined;
      let serverMsg = "Không thể cập nhật khách hàng";
      if (raw) {
        const idx = raw.indexOf(": ");
        const body = idx >= 0 ? raw.slice(idx + 2) : raw;
        try {
          const json = JSON.parse(body);
          if (json?.error) serverMsg = json.error;
        } catch {
          serverMsg = body;
        }
      }
      if (/Email đã tồn tại/i.test(serverMsg) || /Email không hợp lệ/i.test(serverMsg)) {
        form.setError("email", { message: serverMsg });
      }
      if (/Số điện thoại đã tồn tại/i.test(serverMsg) || /Số điện thoại.*10 chữ số/i.test(serverMsg)) {
        form.setError("phone", { message: serverMsg });
      }
      toast({ title: "Lỗi", description: serverMsg, variant: "destructive" });
    },
  });

  const onSubmit = (data: CustomerFormData) => updateMutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cập nhật khách hàng</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên *</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại *</Label>
            <Input id="phone" {...form.register("phone")} />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea id="address" {...form.register("address")} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


