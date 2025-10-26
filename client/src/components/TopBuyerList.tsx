import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Customer } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { startOfDay, subDays, subMonths, startOfYear } from "date-fns";

export function TopBuyerList({ filters }: { filters?: { timeframe: "week" | "month" | "year"; customerType: string } }) {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const rows = useMemo(() => {
    let list = invoices.slice();
    if (filters?.timeframe === "week") {
      const since = subDays(startOfDay(new Date()), 6);
      list = list.filter((inv) => new Date(inv.createdAt as any) >= since);
    } else if (filters?.timeframe === "month") {
      const since = subMonths(startOfDay(new Date()), 1);
      list = list.filter((inv) => new Date(inv.createdAt as any) >= since);
    } else if (filters?.timeframe === "year") {
      const since = startOfYear(new Date());
      list = list.filter((inv) => new Date(inv.createdAt as any) >= since);
    }

    const byId = new Map(customers.map(c => [c.id, c]));
    const agg = new Map<string, { name: string; type: string; orders: number; spent: number }>();

    for (const inv of list) {
      const cid = (inv.customerId as any) as string | undefined;
      if (!cid) continue;
      const customer = byId.get(cid);
      const type = customer?.type || "Unknown";
      if (filters && filters.customerType && filters.customerType !== "All" && type !== filters.customerType) continue;
      const key = cid;
      const cur = agg.get(key) || { name: customer?.name || String(cid), type, orders: 0, spent: 0 };
      cur.orders += 1;
      cur.spent += parseFloat(inv.total as string);
      agg.set(key, cur);
    }

    return Array.from(agg.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  }, [invoices, customers, filters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Top Depo/Dealer Buyers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.length === 0 && <div className="text-sm text-muted-foreground">No buyers in this range.</div>}
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <div className="font-medium text-sm">{row.name}</div>
                <div className="text-xs text-muted-foreground">{row.orders} orders</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={row.type === "Dealer" ? "secondary" : "default"}>{row.type}</Badge>
                <span className="font-mono font-semibold">${row.spent.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
