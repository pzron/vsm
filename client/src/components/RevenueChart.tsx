import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Product } from "@shared/schema";
import { format, startOfDay, subDays, subMonths } from "date-fns";
import type { ReportFilters } from "@/components/ReportsFilters";

interface RevenueChartProps {
  filters?: ReportFilters;
}

export function RevenueChart({ filters }: RevenueChartProps) {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
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

  const chartData = useMemo(() => {
    const now = new Date();
    if (period === "week") {
      const days: { name: string; revenue: number; cost: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = startOfDay(subDays(now, i));
        const label = format(d, "EEE");
        let revenue = 0, cost = 0;
        for (const inv of filtered) {
          const created = startOfDay(new Date(inv.createdAt as any));
          if (created.getTime() !== d.getTime()) continue;
          revenue += parseFloat(inv.total as string);
          cost += (inv.items as any[]).reduce((s, it) => s + parseFloat(it.costPrice || "0") * (it.quantity || 0), 0);
        }
        days.push({ name: label, revenue, cost });
      }
      return days;
    }
    if (period === "month") {
      const days: { name: string; revenue: number; cost: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = startOfDay(subDays(now, i));
        const label = format(d, "dd");
        let revenue = 0, cost = 0;
        for (const inv of filtered) {
          const created = startOfDay(new Date(inv.createdAt as any));
          if (created.getTime() !== d.getTime()) continue;
          revenue += parseFloat(inv.total as string);
          cost += (inv.items as any[]).reduce((s, it) => s + parseFloat(it.costPrice || "0") * (it.quantity || 0), 0);
        }
        days.push({ name: label, revenue, cost });
      }
      return days;
    }
    // year: last 12 months
    const months: { name: string; revenue: number; cost: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM");
      let revenue = 0, cost = 0;
      for (const inv of filtered) {
        const created = new Date(inv.createdAt as any);
        if (format(created, "yyyy-MM") !== key) continue;
        revenue += parseFloat(inv.total as string);
        cost += (inv.items as any[]).reduce((s, it) => s + parseFloat(it.costPrice || "0") * (it.quantity || 0), 0);
      }
      months.push({ name: label, revenue, cost });
    }
    return months;
  }, [filtered, period]);

  return (
    <Card data-testid="card-revenue-chart">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Revenue Trends</CardTitle>
        <Select value={period} onValueChange={v => setPeriod(v as any)}>
          <SelectTrigger className="w-32" data-testid="select-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              name="Cost"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
