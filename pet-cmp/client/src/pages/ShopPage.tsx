import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory", { search }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Tìm sản phẩm, thuốc, phụ kiện..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it: any) => (
            <Card key={it.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{it.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{it.category}</p>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between">
                <div className="font-semibold">{Number(it.price).toLocaleString()} ₫</div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/product/${it.id}`}>Xem</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


