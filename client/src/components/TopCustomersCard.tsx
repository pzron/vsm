import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Customer } from "@shared/schema";

export function TopCustomersCard() {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const map = new Map<string, { name: string; orders: number; revenue: number }>();
  for (const inv of invoices) {
    const cid = String((inv.customerId as any) || (inv.customerName as any) || "");
    if (!cid) continue;
    const cust = customers.find(c => c.id === cid);
    const name = cust?.name || (inv.customerName as any) || "Walk-in";
    const acc = map.get(cid) || { name, orders: 0, revenue: 0 };
    acc.orders += 1;
    acc.revenue += parseFloat(inv.total as string);
    map.set(cid, acc);
  }

  const rows = Array.from(map.entries())
    .map(([id, agg]) => ({ id, ...agg }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  return (
    <Card data-testid="card-top-customers">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Top Customers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((c, index) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-md border hover-elevate"
              data-testid={`top-customer-${c.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{c.orders} orders</Badge>
                  </div>
                </div>
              </div>
              <span className="font-mono font-semibold">${c.revenue.toFixed(2)}</span>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-muted-foreground">No customer data available.</div>}
        </div>
      </CardContent>
    </Card>
  );
}
