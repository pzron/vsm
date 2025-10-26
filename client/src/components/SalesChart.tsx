import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Customer } from "@shared/schema";
import { startOfDay, subDays, subMonths, startOfYear } from "date-fns";

export function SalesChart({ filters }: { filters?: { timeframe: "week" | "month" | "year"; customerType: string } }) {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const last7: { day: string; sales: number; profit: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    last7.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), sales: 0, profit: 0 });
  }
  const last6Months: { month: string; sales: number; profit: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({ month: d.toLocaleDateString(undefined, { month: "short" }), sales: 0, profit: 0 });
  }

  // filter invoices by timeframe and customer type
  let filtered = invoices.slice();
  if (filters?.timeframe === "week") {
    const since = subDays(startOfDay(new Date()), 6);
    filtered = filtered.filter((inv) => new Date(inv.createdAt as any) >= since);
  } else if (filters?.timeframe === "month") {
    const since = subMonths(startOfDay(new Date()), 1);
    filtered = filtered.filter((inv) => new Date(inv.createdAt as any) >= since);
  } else if (filters?.timeframe === "year") {
    const since = startOfYear(new Date());
    filtered = filtered.filter((inv) => new Date(inv.createdAt as any) >= since);
  }

  if (filters && filters.customerType && filters.customerType !== "All") {
    const byId = new Map(customers.map(c => [c.id, c]));
    filtered = filtered.filter((inv) => {
      const cid = (inv.customerId as any) as string | undefined;
      const ct = cid ? byId.get(cid)?.type : (inv as any).customerType;
      return ct === filters.customerType;
    });
  }

  for (const inv of filtered) {
    const created = new Date(inv.createdAt as any);
    const invTotal = parseFloat(inv.total as string);
    const items = inv.items as any[];
    const invProfit = items.reduce((sum, it) => {
      const price = parseFloat(it.price);
      const cost = parseFloat(it.costPrice || "0");
      return sum + (price - cost) * it.quantity;
    }, 0);

    // daily bucket
    const dayLabel = created.toLocaleDateString(undefined, { weekday: "short" });
    const daily = last7.find((d) => d.day === dayLabel);
    if (daily) {
      daily.sales += invTotal;
      daily.profit += invProfit;
    }
    // monthly bucket
    const monthLabel = created.toLocaleDateString(undefined, { month: "short" });
    const monthly = last6Months.find((m) => m.month === monthLabel);
    if (monthly) {
      monthly.sales += invTotal;
      monthly.profit += invProfit;
    }
  }

  return (
    <Card data-testid="card-sales-chart">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Sales & Profit Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="mb-4">
            <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" name="Sales" />
                <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="monthly">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last6Months}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" name="Sales" />
                <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
