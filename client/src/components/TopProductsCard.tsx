import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Product } from "@shared/schema";

export function TopProductsCard() {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const map = new Map<string, { sold: number; revenue: number }>();
  for (const inv of invoices) {
    const items = inv.items as any[];
    for (const it of items) {
      const pid = it.productId as string;
      const qty = Number(it.quantity || 0);
      const price = parseFloat(it.price || "0");
      const acc = map.get(pid) || { sold: 0, revenue: 0 };
      acc.sold += qty;
      acc.revenue += qty * price;
      map.set(pid, acc);
    }
  }
  const rows = Array.from(map.entries())
    .map(([pid, agg]) => {
      const p = products.find(pp => pp.id === pid);
      return {
        id: pid,
        name: p?.name || pid,
        category: p?.category || "",
        sold: agg.sold,
        revenue: agg.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  return (
    <Card data-testid="card-top-products">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 rounded-md border hover-elevate"
              data-testid={`top-product-${product.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    <span className="text-xs text-muted-foreground">{product.sold} sold</span>
                  </div>
                </div>
              </div>
              <span className="font-mono font-semibold">${product.revenue.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
