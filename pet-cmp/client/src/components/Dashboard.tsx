import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "./StatsCard";
import { Calendar, DollarSign, Package, Users, Clock, TrendingUp, FileText, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const statusColors = {
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusLabels = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  urgent: "Khẩn cấp",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

export function Dashboard() {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const today = new Date();
  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ["/api/appointments", { date: today.toISOString() }],
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["/api/pets"],
  });

  const { data: lowStock = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const { data: medicalRecords = [] } = useQuery<any[]>({
    queryKey: ["/api/medical-records"],
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer?.name || "Unknown";
  };

  const getPetName = (petId: string) => {
    const pet = pets.find((p: any) => p.id === petId);
    return pet?.name || "Unknown";
  };

  const recentAppointments = appointments.slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Tổng quan hoạt động phòng khám</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng khách hàng"
          value={stats?.totalCustomers || customers.length || 0}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Lịch hẹn hôm nay"
          value={stats?.todayAppointments || appointments.length || 0}
          icon={Calendar}
          iconColor="text-chart-2"
        />
        <StatsCard
          title="Doanh thu tháng"
          value={`₫${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 8, isPositive: true }}
          iconColor="text-chart-3"
        />
        <StatsCard
          title="Thuốc sắp hết"
          value={stats?.lowStockCount || lowStock.length || 0}
          icon={Package}
          iconColor="text-destructive"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Lịch hẹn hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có lịch hẹn</p>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => {
                  const appointmentTime = new Date(appointment.appointmentDate);
                  const timeString = appointmentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={appointment.id} className="flex items-center gap-4 p-3 rounded-lg hover-elevate" data-testid={`appointment-${appointment.id}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{getPetName(appointment.petId)[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" data-testid={`text-pet-name`}>{getPetName(appointment.petId)}</p>
                        <p className="text-sm text-muted-foreground truncate">{getCustomerName(appointment.customerId)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium font-mono">{timeString}</p>
                        <Badge variant="secondary" className={statusColors[appointment.status as keyof typeof statusColors]}>
                          {statusLabels[appointment.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-3" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 mt-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Hệ thống khởi động thành công</p>
                  <p className="text-xs text-muted-foreground">Vừa xong</p>
                </div>
              </div>
              {lowStock.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-amber-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Cảnh báo: {lowStock.length} thuốc sắp hết</p>
                    <p className="text-xs text-muted-foreground">Hệ thống</p>
                  </div>
                </div>
              )}
              {appointments.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{appointments.length} lịch hẹn hôm nay</p>
                    <p className="text-xs text-muted-foreground">Hệ thống</p>
                  </div>
                </div>
              )}
              {invoices.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-purple-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{invoices.length} hóa đơn tháng này</p>
                    <p className="text-xs text-muted-foreground">Tài chính</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Hồ sơ khám gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicalRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có hồ sơ</p>
            ) : (
              <div className="space-y-3">
                {medicalRecords.slice(0,5).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg hover-elevate">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.diagnosis || 'Khám'}</p>
                      <p className="text-xs text-muted-foreground truncate">{new Date(r.visitDate).toLocaleString('vi-VN')}</p>
                    </div>
                    <Badge variant="secondary">{getPetName(r.petId)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-chart-3" />
              Hóa đơn gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có hóa đơn</p>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0,5).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg hover-elevate">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{new Date(inv.issuedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium">₫{parseFloat(inv.totalAmount).toLocaleString()}</p>
                      <Badge variant="secondary" className="text-xs">{inv.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
