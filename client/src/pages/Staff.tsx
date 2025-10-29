import { StaffTable } from "@/components/StaffTable";
import { StatCard } from "@/components/StatCard";
import { StaffActivityLog } from "@/components/StaffActivityLog";
import { Users, UserCheck, TrendingUp, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { User, Invoice } from "@shared/schema";
import { startOfDay } from "date-fns";

export default function Staff() {
  const { data: staff = [] } = useQuery<User[]>({ queryKey: ["/api/staff"], refetchInterval: 5000 });
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"], refetchInterval: 5000 });

  const totalStaff = staff.length;
  // Active today: staff with at least one invoice today
  const todayStart = startOfDay(new Date());
  const activeTodaySet = new Set<string>();
  let totalRevenue = 0;
  let totalProfit = 0;
  for (const inv of invoices) {
    const created = new Date((inv as any).createdAt as any);
    if (created >= todayStart) {
      const sid = String((inv as any).staffId || "");
      if (sid) activeTodaySet.add(sid);
    }
    const items = (inv.items as any[]) || [];
    const revenue = parseFloat(inv.total as string) || 0;
    const profit = items.reduce((sum, it) => sum + (parseFloat(it.price) - parseFloat(it.costPrice || "0")) * (it.quantity || 0), 0);
    totalRevenue += revenue;
    totalProfit += profit;
  }
  const activeToday = activeTodaySet.size;
  const avgPerformance = totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : "—";
  const monthlyPayroll = (() => {
    const sum = staff.reduce((s, u) => s + (parseFloat((u as any).salary || "0") || 0), 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(sum);
  })();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <p className="text-muted-foreground">Manage employees, track performance, and monitor activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Staff" value={String(totalStaff)} icon={Users} iconColor="text-primary" />
        <StatCard title="Active Today" value={String(activeToday)} icon={UserCheck} iconColor="text-success" />
        <StatCard title="Avg Performance" value={avgPerformance} icon={TrendingUp} iconColor="text-info" />
        <StatCard title="Monthly Payroll" value={monthlyPayroll} icon={DollarSign} iconColor="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StaffTable />
        </div>
        <StaffActivityLog />
      </div>
    </div>
  );
}
