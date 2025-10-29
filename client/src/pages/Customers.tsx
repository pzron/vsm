import { CustomerTable } from "@/components/CustomerTable";
import { StatCard } from "@/components/StatCard";
import { Users, Star, TrendingUp, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Customer, Invoice } from "@shared/schema";
import { startOfDay, subDays, startOfMonth } from "date-fns";

export default function Customers() {
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"], refetchInterval: 5000 });
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"], refetchInterval: 5000 });

  const totalCustomers = customers.length;
  const vipMembers = customers.filter(c => (c as any).type === "VIP").length;
  // Active this week: unique customers with an invoice in last 7 days
  const sinceWeek = subDays(startOfDay(new Date()), 6);
  const activeCustomerIds = new Set<string>();
  for (const inv of invoices) {
    const created = new Date((inv as any).createdAt as any);
    if (created >= sinceWeek) {
      const cid = String((inv.customerId as any) || "");
      if (cid) activeCustomerIds.add(cid);
    }
  }
  const activeThisWeek = activeCustomerIds.size;
  // New this month: customers with createdAt in current month, fallback to customers who had first invoice this month
  const monthStart = startOfMonth(new Date());
  let newThisMonth = customers.filter(c => {
    const ca = (c as any).createdAt ? new Date((c as any).createdAt) : null;
    return ca ? ca >= monthStart : false;
  }).length;
  if (newThisMonth === 0) {
    const firstSeen = new Map<string, Date>();
    for (const inv of invoices) {
      const cid = String((inv.customerId as any) || "");
      if (!cid) continue;
      const created = new Date((inv as any).createdAt as any);
      const prev = firstSeen.get(cid);
      if (!prev || created < prev) firstSeen.set(cid, created);
    }
    newThisMonth = Array.from(firstSeen.values()).filter(d => d >= monthStart).length;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground">Manage customer profiles, loyalty points, and purchase history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Customers" value={String(totalCustomers)} icon={Users} iconColor="text-primary" />
        <StatCard title="VIP Members" value={String(vipMembers)} icon={Star} iconColor="text-warning" />
        <StatCard title="Active This Week" value={String(activeThisWeek)} icon={TrendingUp} iconColor="text-success" />
        <StatCard title="New This Month" value={String(newThisMonth)} icon={UserPlus} iconColor="text-info" />
      </div>

      <CustomerTable />
    </div>
  );
}
