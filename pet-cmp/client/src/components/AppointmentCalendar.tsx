import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddAppointmentDialog } from "./AddAppointmentDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const statusColors = {
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const statusLabels = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  urgent: "Khẩn cấp",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

export function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formattedDate = currentDate.toLocaleDateString('vi-VN');

  // Normalize currentDate to start of day in local timezone for query key
  // Extract year, month, day to avoid timezone issues
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  
  // Create date at midnight in local timezone, then convert to ISO
  const normalizedDate = new Date(year, month, day, 0, 0, 0, 0);
  const dateKey = normalizedDate.toISOString();

  // Build appointments URL with date query param
  const appointmentsUrl = `/api/appointments?date=${encodeURIComponent(dateKey)}`;
  
  // Debug logging (console only)
  useEffect(() => {
    console.log("AppointmentCalendar - currentDate:", currentDate.toISOString());
    console.log("AppointmentCalendar - normalizedDate:", normalizedDate.toISOString());
    console.log("AppointmentCalendar - dateKey:", dateKey);
  }, [dateKey]);

  const { data: appointments = [], isLoading, refetch, error } = useQuery<any[]>({
    queryKey: [appointmentsUrl],
    queryFn: async () => {
      console.log("Fetching appointments from:", appointmentsUrl);
      console.log("Date key:", dateKey);
      const res = await fetch(appointmentsUrl);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch appointments:", res.status, errorText);
        throw new Error("Tải danh sách lịch hẹn thất bại");
      }
      const data = await res.json();
      console.log("Appointments fetched:", data.length, "items");
      console.log("Appointments data:", data);
      return Array.isArray(data) ? data : [];
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });


  // Refetch when date changes (debounced to avoid too many requests)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("Date changed, refetching appointments for:", dateKey);
      refetch();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [dateKey, refetch]);

  const confirmMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const res = await apiRequest("PATCH", `/api/appointments/${appointmentId}`, { status: "confirmed" });
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/appointments"], exact: false });
      await refetch();
      toast({ title: "Đã xác nhận", description: "Lịch hẹn đã được xác nhận." });
      setSelected(null);
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể xác nhận lịch hẹn", variant: "destructive" });
    }
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["/api/pets"],
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer?.name || "Unknown";
  };

  const getPetName = (petId: string) => {
    const pet = pets.find((p: any) => p.id === petId);
    return pet?.name || "Unknown";
  };

  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Lỗi khi tải danh sách lịch hẹn</p>
          <Button onClick={() => refetch()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold" data-testid="text-page-title">Lịch khám</h1>
          <p className="text-muted-foreground mt-1">Quản lý lịch hẹn khám bệnh</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-appointment">
          <Plus className="h-4 w-4 mr-2" />
          Đặt lịch mới
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={prevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted">
          <CalendarIcon className="h-4 w-4" />
          <span className="font-medium">{formattedDate}</span>
        </div>
        <Button variant="outline" size="icon" onClick={nextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={goToToday}>
          Hôm nay
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Danh sách ({appointments.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">Không có lịch hẹn nào trong ngày này</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Đặt lịch hẹn
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment: any) => {
                const appointmentTime = new Date(appointment.appointmentDate);
                const timeString = appointmentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const statusColor = statusColors[appointment.status as keyof typeof statusColors] || statusColors.pending;
                
                return (
                  <Card key={appointment.id} className={`border-l-4 ${statusColor}`} data-testid={`appointment-card-${appointment.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Clock className="h-5 w-5" />
                          <span className="font-mono font-semibold text-lg">{timeString}</span>
                        </div>
                        <div className="h-12 w-px bg-border"></div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{getPetName(appointment.petId)[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold" data-testid="text-pet-name">{getPetName(appointment.petId)}</p>
                          <p className="text-sm text-muted-foreground">{getCustomerName(appointment.customerId)}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">{appointment.appointmentType}</Badge>
                          <p className="text-sm text-muted-foreground">
                            {statusLabels[appointment.status as keyof typeof statusLabels]}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelected(appointment)}>Chi tiết</Button>
                          {appointment.status === "pending" && (
                            <Button size="sm" onClick={() => confirmMutation.mutate(appointment.id)}>Xác nhận</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddAppointmentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Thời gian:</span> {new Date(selected.appointmentDate).toLocaleString('vi-VN')}</p>
              <p><span className="text-muted-foreground">Dịch vụ:</span> {selected.appointmentType}</p>
              <p><span className="text-muted-foreground">Trạng thái:</span> {statusLabels[selected.status as keyof typeof statusLabels]}</p>
              {selected.notes && (
                <p><span className="text-muted-foreground">Ghi chú:</span> {selected.notes}</p>
              )}
            </div>
          )}
          <DialogFooter>
            {selected && selected.status === 'pending' && (
              <Button onClick={() => confirmMutation.mutate(selected.id)} disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
