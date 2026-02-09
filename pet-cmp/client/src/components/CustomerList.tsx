import { useMemo, useState } from "react";
import { Search, Plus, MoreHorizontal, Mail, Phone } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { AddPetDialog } from "./AddPetDialog";
import { EditCustomerDialog } from "./EditCustomerDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function CustomerList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddPetDialog, setShowAddPetDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const customersUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (statusFilter !== "all") params.set("active", String(statusFilter === "active"));
    const qs = params.toString();
    return `/api/customers${qs ? `?${qs}` : ""}`;
  }, [searchTerm, statusFilter]);

  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: [customersUrl],
    queryFn: async () => {
      const res = await fetch(customersUrl);
      if (!res.ok) throw new Error("Tải danh sách khách hàng thất bại");
      return await res.json();
    },
  });

  const { data: allPets = [] } = useQuery<any[]>({
    queryKey: ["/api/pets"],
  });

  const getPetCount = (customerId: string) => {
    return allPets.filter((pet: any) => pet.customerId === customerId).length;
  };

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Duyệt khách hàng thất bại');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: [customersUrl] });
      toast({ title: "Thành công", description: "Đã duyệt khách hàng" });
    },
    onError: (err: any) => toast({ title: "Lỗi", description: err?.message || "Duyệt khách hàng thất bại", variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}/deactivate`, { method: 'POST' });
      if (!res.ok) throw new Error('Vô hiệu hóa thất bại');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: [customersUrl] });
      toast({ title: "Thành công", description: "Đã vô hiệu hóa khách hàng" });
    },
    onError: (err: any) => toast({ title: "Lỗi", description: err?.message || "Vô hiệu hóa thất bại", variant: "destructive" }),
  });

  const handleAddPet = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowAddPetDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold" data-testid="text-page-title">Khách hàng</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin khách hàng và thú cưng</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-customer">
          <Plus className="h-4 w-4 mr-2" />
          Thêm khách hàng
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="flex-1">Danh sách khách hàng ({customers.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button asChild variant="outline">
                <a href="/api/export/customers" download>Xuất khách hàng (CSV)</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/api/export/pets" download>Xuất thú cưng (CSV)</a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Chưa có khách hàng nào</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm khách hàng đầu tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Số thú cưng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">{customer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" data-testid="text-customer-name">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.address || "Chưa có địa chỉ"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.isActive ? (
                        <Badge>Đang hoạt động</Badge>
                      ) : (
                        <Badge variant="destructive">Chờ duyệt</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getPetCount(customer.id)} thú cưng</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${customer.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAddPet(customer.id)}>
                            Thêm thú cưng
                          </DropdownMenuItem>
                          {!customer.isActive && (
                            <DropdownMenuItem onClick={() => approveMutation.mutate(customer.id)}>
                              Duyệt kích hoạt
                            </DropdownMenuItem>
                          )}
                          {customer.isActive && (
                            <DropdownMenuItem onClick={() => deactivateMutation.mutate(customer.id)}>
                              Vô hiệu hóa
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>Chỉnh sửa</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddCustomerDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <AddPetDialog
        open={showAddPetDialog}
        onOpenChange={setShowAddPetDialog}
        customerId={selectedCustomerId}
      />
      <EditCustomerDialog open={!!editingCustomer} onOpenChange={(o) => !o && setEditingCustomer(null)} customer={editingCustomer} />
    </div>
  );
}
