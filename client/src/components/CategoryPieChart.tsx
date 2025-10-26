import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Product } from "@shared/schema";
import type { ReportFilters } from "@/components/ReportsFilters";

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryPieChartProps {
  data?: CategoryData[];
  title?: string;
  filters?: ReportFilters;
}

export function CategoryPieChart({ data, title = "Sales by Category", filters }: CategoryPieChartProps) {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const productCategory = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.id, p.category || "Others");
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
    if (filters?.staffId && filters.staffId !== "all") {
      list = list.filter(inv => String((inv as any).staffId || "") === filters.staffId);
    }
    return list;
  }, [invoices, filters]);

  const liveData: CategoryData[] = useMemo(() => {
    const agg = new Map<string, number>();
    for (const inv of filtered) {
      for (const it of (inv.items as any[])) {
        const cat = productCategory.get(it.productId) || "Others";
        const revenue = parseFloat(it.price || "0") * (it.quantity || 0);
        agg.set(cat, (agg.get(cat) || 0) + revenue);
      }
    }
    return Array.from(agg.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered, productCategory]);

  const chartData = data || liveData;
  
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <Card data-testid="card-category-pie">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
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
