import { StatCard } from "@/components/StatCard";
import { SalesChart } from "@/components/SalesChart";
import { TopProductsCard } from "@/components/TopProductsCard";
import { PaymentBreakdownChart } from "@/components/PaymentBreakdownChart";
import { DollarSign, TrendingUp, ShoppingBag, Percent, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Customer } from "@shared/schema";
import { SalesFilters, type Timeframe } from "@/components/SalesFilters";
import { useMemo, useState } from "react";
import { SalesBuyerTypeChart } from "@/components/SalesBuyerTypeChart";
import { TopBuyerList } from "@/components/TopBuyerList";

export default function Sales() {
  const { data: analytics } = useQuery<any>({ queryKey: ["/api/analytics/dashboard"] });
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const [filters, setFilters] = useState<{ timeframe: Timeframe; customerType: string }>({ timeframe: "week", customerType: "All" });

  const totals = useMemo(() => {
    let list = invoices.slice();
    // timeframe filter roughly applied in KPI as well for consistency
    const now = new Date();
    if (filters.timeframe === "week") {
      const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      list = list.filter(inv => new Date(inv.createdAt as any) >= since);
    } else if (filters.timeframe === "month") {
      const since = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      list = list.filter(inv => new Date(inv.createdAt as any) >= since);
    } else if (filters.timeframe === "year") {
      const since = new Date(now.getFullYear(), 0, 1);
      list = list.filter(inv => new Date(inv.createdAt as any) >= since);
    }
    if (filters.customerType !== "All") {
      const byId = new Map(customers.map(c => [c.id, c]));
      list = list.filter(inv => {
        const cid = (inv.customerId as any) as string | undefined;
        const type = cid ? byId.get(cid)?.type : (inv as any).customerType;
        return type === filters.customerType;
      });
    }
    const revenue = list.reduce((s, inv) => s + parseFloat(inv.total as string), 0);
    const orders = list.length;
    let profit = 0;
    const customerOrderMap = new Map<string, number>();
    for (const inv of list) {
      const items = inv.items as any[];
      profit += items.reduce((sum, it) => sum + (parseFloat(it.price) - parseFloat(it.costPrice || "0")) * (it.quantity || 0), 0);
      const cid = String((inv.customerId as any) || "");
      if (cid) customerOrderMap.set(cid, (customerOrderMap.get(cid) || 0) + 1);
    }
    const aov = orders > 0 ? revenue / orders : 0;
    const repeatCustomers = Array.from(customerOrderMap.values()).filter(c => c > 1).length;
    const uniqueCustomers = customerOrderMap.size;
    const repeatRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;
    return { revenue, profit, orders, aov, repeatRate };
  }, [invoices, customers, filters]);

  const totalRevenue = `$${totals.revenue.toFixed(2)}`;
  const totalProfit = `$${totals.profit.toFixed(2)}`;
  const totalOrders = String(totals.orders);
  const profitMargin = totals.revenue > 0 ? `${((totals.profit / totals.revenue) * 100).toFixed(1)}%` : "—";
  const aov = totals.orders > 0 ? `$${totals.aov.toFixed(2)}` : "—";
  const repeatRate = `${totals.repeatRate.toFixed(1)}%`;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Analytics</h1>
        <p className="text-muted-foreground">Track sales performance, revenue, and profit margins</p>
      </div>

      <SalesFilters onChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={totalRevenue}
          change={undefined}
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Gross Profit"
          value={totalProfit}
          change={undefined}
          icon={TrendingUp}
          iconColor="text-info"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          change={undefined}
          icon={ShoppingBag}
          iconColor="text-primary"
        />
        <StatCard
          title="Profit Margin"
          value={profitMargin}
          change={undefined}
          icon={Percent}
          iconColor="text-warning"
        />
        <StatCard
          title="Avg Order Value"
          value={aov}
          change={undefined}
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Repeat Customer Rate"
          value={repeatRate}
          change={undefined}
          icon={Users}
          iconColor="text-secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart filters={filters} />
        </div>
        <TopProductsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentBreakdownChart />
        <SalesBuyerTypeChart filters={filters} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopBuyerList filters={filters} />
      </div>
    </div>
  );
}
