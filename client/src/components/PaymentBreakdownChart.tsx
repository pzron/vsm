import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Product } from "@shared/schema";
import type { ReportFilters } from "@/components/ReportsFilters";

interface PaymentBreakdownChartProps {
  filters?: ReportFilters;
}

export function PaymentBreakdownChart({ filters }: PaymentBreakdownChartProps) {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const productCategory = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.id, p.category || "");
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    let list = invoices.slice();
    if (filters?.dateFrom) list = list.filter(inv => new Date(inv.createdAt as any) >= filters.dateFrom!);
    if (filters?.dateTo) list = list.filter(inv => new Date(inv.createdAt as any) <= filters.dateTo!);
    if (filters?.payment && filters.payment !== "all") {
      const needle = filters.payment.toLowerCase();
      list = list.filter(inv => ((inv.payments as any[]) || []).some(p => String(p.method || "").toLowerCase().includes(needle)));
    }
    if (filters?.category && filters.category !== "all") {
      list = list.filter(inv => (inv.items as any[]).some(it => productCategory.get(it.productId) === filters.category));
    }
    if (filters?.staffId && filters.staffId !== "all") {
      list = list.filter(inv => String((inv as any).staffId || "") === filters.staffId);
    }
    return list;
  }, [invoices, filters, productCategory]);

  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of filtered) {
      const pays = (inv.payments as any[]) || [];
      for (const p of pays) {
        const method = p.method || "Other";
        const amount = parseFloat(p.amount || "0");
        map.set(method, (map.get(method) || 0) + amount);
      }
    }
    return Array.from(map.entries()).map(([name, amount]) => ({ name, value: amount }));
  }, [filtered]);

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-3))",
  ];

  return (
    <Card data-testid="card-payment-breakdown">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
