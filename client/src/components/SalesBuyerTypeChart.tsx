import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Customer } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { startOfDay, subDays, subMonths, startOfYear } from "date-fns";

export function SalesBuyerTypeChart({ filters }: { filters?: { timeframe: "week" | "month" | "year"; customerType: string } }) {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

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
  const agg = new Map<string, { revenue: number; orders: number }>();
  for (const inv of list) {
    const cid = (inv.customerId as any) as string | undefined;
    const type = (cid ? byId.get(cid)?.type : (inv as any).customerType) || "Unknown";
    if (filters && filters.customerType && filters.customerType !== "All" && type !== filters.customerType) continue;
    const total = parseFloat(inv.total as string);
    const x = agg.get(type) || { revenue: 0, orders: 0 };
    x.revenue += total;
    x.orders += 1;
    agg.set(type, x);
  }
  const data = Array.from(agg.entries()).map(([type, v]) => ({ type, revenue: Number(v.revenue.toFixed(2)), orders: v.orders }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Revenue by Customer Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="type" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
            <Legend />
            <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue" />
            <Bar dataKey="orders" fill="hsl(var(--chart-2))" name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
