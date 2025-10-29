import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Customer, Product } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { startOfDay, subDays, subMonths, startOfYear } from "date-fns";

type Timeframe = "week" | "month" | "year";

export function TopBuyerList({ filters }: { filters?: { timeframe?: Timeframe; customerType?: string; district?: string; thana?: string } }) {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id as any, p);
    return map;
  }, [products]);

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
    const agg = new Map<string, { name: string; type: string; orders: number; spent: number; points: number }>();

    for (const inv of list) {
      const cid = (inv.customerId as any) as string | undefined;
      if (!cid) continue;
      const customer = byId.get(cid);
      const type = customer?.type || "Unknown";
      // Type filter
      if (filters?.customerType && filters.customerType !== "All" && type !== filters.customerType) continue;
      // District/Thana filter
      const cDistrict = (customer as any)?.district || "";
      const cThana = (customer as any)?.thana || "";
      if (filters?.district && filters.district !== "All" && cDistrict !== filters.district) continue;
      if (filters?.thana && filters.thana !== "All" && cThana !== filters.thana) continue;

      const items = (inv.items as any[]) || [];
      const spentAdd = parseFloat(inv.total as string);
      let pointsAdd = 0;
      for (const it of items) {
        const pid = String(it.productId || it.id || "");
        const qty = Number(it.quantity || it.qty || 0);
        const prod = productById.get(pid as any) as any;
        const ptsPerUnit = prod?.points ? Number(prod.points) : 0;
        pointsAdd += ptsPerUnit * qty;
      }

      const key = cid;
      const cur = agg.get(key) || { name: customer?.name || String(cid), type, orders: 0, spent: 0, points: 0 };
      cur.orders += 1;
      cur.spent += spentAdd;
      cur.points += pointsAdd;
      agg.set(key, cur);
    }

    return Array.from(agg.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);
  }, [invoices, customers, products, productById, filters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Top Buyers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.length === 0 && <div className="text-sm text-muted-foreground">No buyers in this range.</div>}
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <div className="font-medium text-sm">{row.name}</div>
                <div className="text-xs text-muted-foreground">Type: {row.type}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">Buy: <span className="font-mono font-semibold">{row.orders}</span></span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs">Pts: <span className="font-mono font-semibold">{row.points}</span></span>
                <span className="px-2 py-0.5 rounded bg-pink-100 text-pink-800 text-xs">Price: <span className="font-mono font-semibold">${row.spent.toFixed(2)}</span></span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
