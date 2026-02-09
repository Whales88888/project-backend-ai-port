import { Receipt, Plus, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Invoice = {
  id: string;
  customerId: string;
  appointmentId?: string | null;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
  issuedAt: string;
};

const statusConfig = {
  paid: { label: "Đã thanh toán", variant: "secondary" as const, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pending: { label: "Chờ thanh toán", variant: "secondary" as const, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  overdue: { label: "Quá hạn", variant: "destructive" as const, className: "" },
};

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const { data: customers = [] } = useQuery<any[]>({ queryKey: ["/api/customers"] });
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter((inv: any) => {
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      const customer = customers.find((c: any) => c.id === inv.customerId);
      const hay = `${inv.invoiceNumber} ${customer?.name || inv.customerId} ${inv.status}`.toLowerCase();
      const matchTerm = term === "" || hay.includes(term);
      return matchStatus && matchTerm;
    });
  }, [invoices, customers, search, statusFilter]);

  const payMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      const res = await apiRequest("POST", "/api/payments", {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        paymentMethod: "cash",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Thanh toán thành công" });
    },
    onError: () => toast({ title: "Lỗi", description: "Không thể thanh toán", variant: "destructive" })
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const invoiceNumber = `I${Date.now()}`;
      const res = await apiRequest("POST", "/api/invoices", {
        customerId: selectedCustomerId,
        invoiceNumber,
        totalAmount: amount || "0",
        status: "pending",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Đã tạo hóa đơn" });
      setShowCreate(false);
      setSelectedCustomerId("");
      setAmount("");
    },
    onError: () => toast({ title: "Lỗi", description: "Không thể tạo hóa đơn", variant: "destructive" })
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold" data-testid="text-page-title">Hóa đơn</h1>
          <p className="text-muted-foreground mt-1">Quản lý hóa đơn và thanh toán</p>
        </div>
        <Button data-testid="button-create-invoice" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo hóa đơn
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng hóa đơn</p>
                <p className="text-2xl font-bold">₫2.85M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Receipt className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã thu</p>
                <p className="text-2xl font-bold">₫2.05M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chưa thu</p>
                <p className="text-2xl font-bold">₫800K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="flex-1">Danh sách hóa đơn</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm hóa đơn..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Chưa có hóa đơn phù hợp</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo hóa đơn
              </Button>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã hóa đơn</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((invoice: any) => {
                const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.pending;
                const customer = customers.find((c: any) => c.id === invoice.customerId);
                return (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{new Date(invoice.issuedAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{customer?.name || invoice.customerId}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      ₫{parseFloat(invoice.totalAmount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">Xem</Button>
                        {invoice.status === "pending" && (
                          <Button size="sm" onClick={() => payMutation.mutate(invoice)} disabled={payMutation.isPending}>
                            {payMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo hóa đơn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Khách hàng</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Số tiền</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!selectedCustomerId || !amount || createMutation.isPending}>
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo hóa đơn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
