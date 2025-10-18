import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopProduct {
  id: string;
  name: string;
  sold: number;
  revenue: string;
  category: string;
}

export function TopProductsCard() {
  // todo: remove mock functionality
  const products: TopProduct[] = [
    { id: "1", name: "Wireless Mouse", sold: 145, revenue: "$4,345", category: "Electronics" },
    { id: "2", name: "USB-C Cable 2m", sold: 238, revenue: "$3,089", category: "Accessories" },
    { id: "3", name: "Mechanical Keyboard", sold: 67, revenue: "$6,023", category: "Electronics" },
    { id: "4", name: "Notebook A5", sold: 412, revenue: "$2,055", category: "Stationery" },
  ];

  return (
    <Card data-testid="card-top-products">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product, index) => (
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
              <span className="font-mono font-semibold">{product.revenue}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
