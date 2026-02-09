import { useState } from "react";
import { Search, Plus, AlertTriangle, Package } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const inventorySchema = z.object({
  code: z.string().min(1, "Mã là bắt buộc"),
  name: z.string().min(1, "Tên là bắt buộc"),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  quantity: z.string().min(1, "Số lượng là bắt buộc"),
  unit: z.string().min(1, "Đơn vị là bắt buộc"),
  minStockLevel: z.string().min(1, "Mức tồn kho tối thiểu là bắt buộc"),
  price: z.string().min(1, "Giá là bắt buộc"),
  expiryDate: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

export function InventoryTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory", { search: searchTerm, category: filterCategory !== "all" ? filterCategory : undefined }],
  });

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      code: "",
      name: "",
      category: "",
      quantity: "",
      unit: "",
      minStockLevel: "",
      price: "",
      expiryDate: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      // Map to backend schema: stock/minStock/price/code
      const stock = parseInt(data.quantity || "0", 10);
      const minStock = parseInt(data.minStockLevel || "0", 10);
      
      if (isNaN(stock) || stock < 0) {
        throw new Error("Số lượng không hợp lệ");
      }
      if (isNaN(minStock) || minStock < 0) {
        throw new Error("Mức tồn kho tối thiểu không hợp lệ");
      }
      
      const payload = {
        code: data.code,
        name: data.name,
        category: data.category,
        unit: data.unit,
        stock: stock,
        minStock: minStock,
        price: data.price,
      };
      
      console.log("Creating inventory item with payload:", payload);
      const resItem = await apiRequest("POST", "/api/inventory", payload);
      const created = await resItem.json();
      
      // If batch info (expiryDate) is provided, also create a stock batch
      if (data.expiryDate && data.quantity) {
        try {
          const batchNumber = `B${Date.now()}`;
          await apiRequest("POST", "/api/stock-batches", {
            inventoryId: created.id,
            batchNumber,
            quantity: stock,
            expiryDate: new Date(data.expiryDate).toISOString(),
            supplier: "",
          });
        } catch (batchError) {
          console.error("Failed to create stock batch:", batchError);
          // Don't fail the whole operation if batch creation fails
        }
      }
      return created;
    },
    onSuccess: (created) => {
      console.log("Inventory item created successfully:", created);
      
      // Invalidate all inventory queries first to force refetch
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-batches"] });
      
      // Also update cache optimistically for better UX
      queryClient.setQueryData<any[]>(["/api/inventory"], (old) => {
        if (!old) return [created];
        return [created, ...old];
      });
      
      // Update filtered queries
      queryClient.setQueryData<any[]>(["/api/inventory", { search: searchTerm }], (old) => {
        if (!old) return [created];
        return [created, ...old];
      });
      
      if (filterCategory !== "all") {
        queryClient.setQueryData<any[]>(["/api/inventory", { category: filterCategory }], (old) => {
          if (!old) return [created];
          return [created, ...old];
        });
      }
      
      toast({
        title: "Thành công",
        description: "Đã thêm vật tư mới",
      });
      form.reset();
      setShowAddDialog(false);
    },
    onError: (err: any) => {
      console.error("Error creating inventory item:", err);
      let errorMsg = "Không thể thêm vật tư";
      if (err?.message) {
        errorMsg = err.message;
      }
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InventoryFormData) => {
    console.log("Form submitted with data:", data);
    if (!data.code || !data.name || !data.category || !data.unit || !data.quantity || !data.minStockLevel || !data.price) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  const categories = Array.from(new Set(inventory.map((item: any) => item.category)));
  const lowStockItems = inventory.filter((item: any) => (item.stock || 0) <= (item.minStock || 0));

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
          <h1 className="font-serif text-3xl font-bold" data-testid="text-page-title">Kho thuốc & Vật tư</h1>
          <p className="text-muted-foreground mt-1">Quản lý tồn kho và vật tư y tế</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-inventory">
          <Plus className="h-4 w-4 mr-2" />
          Thêm vật tư
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">Cảnh báo tồn kho</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {lowStockItems.length} vật tư sắp hết, cần nhập thêm
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm vật tư..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lọc theo danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inventory.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Chưa có vật tư nào</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm vật tư đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          inventory.map((item) => {
            const stock = item.stock || 0;
            const minStock = item.minStock || 0;
            const isLowStock = stock <= minStock;
            const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
            const isExpiringSoon = expiryDate && expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <Card key={item.id} className={isLowStock ? "border-amber-200 dark:border-amber-800" : ""} data-testid={`card-inventory-${item.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-start justify-between gap-2">
                    <span className="flex-1" data-testid="text-item-name">{item.name}</span>
                    {isLowStock && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Sắp hết
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tồn kho:</span>
                    <span className="font-medium font-mono">
                      {stock} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tối thiểu:</span>
                    <span className="font-mono text-muted-foreground">{minStock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giá:</span>
                    <span className="font-medium">₫{parseFloat(item.price).toLocaleString()}</span>
                  </div>
                  {expiryDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hạn sử dụng:</span>
                      <span className={isExpiringSoon ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                        {expiryDate.toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm vật tư mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã vật tư *</Label>
              <Input id="code" {...form.register("code")} data-testid="input-item-code" />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Tên vật tư *</Label>
              <Input id="name" {...form.register("name")} data-testid="input-item-name" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => {
                  form.setValue("category", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thuốc">Thuốc</SelectItem>
                  <SelectItem value="Vắc-xin">Vắc-xin</SelectItem>
                  <SelectItem value="Dụng cụ y tế">Dụng cụ y tế</SelectItem>
                  <SelectItem value="Thực phẩm">Thực phẩm</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng *</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...form.register("quantity")}
                  data-testid="input-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Đơn vị *</Label>
                <Input id="unit" {...form.register("unit")} placeholder="vd: hộp, lọ, viên" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Tồn kho tối thiểu *</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  {...form.register("minStockLevel")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Giá (₫) *</Label>
                <Input
                  id="price"
                  {...form.register("price")}
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Hạn sử dụng</Label>
              <Input
                id="expiryDate"
                type="date"
                {...form.register("expiryDate")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-inventory">
                {createMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
