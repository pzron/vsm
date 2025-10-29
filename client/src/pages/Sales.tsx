import { StatCard } from "@/components/StatCard";
import { SalesChart } from "@/components/SalesChart";
import { TopProductsCard } from "@/components/TopProductsCard";
import { PaymentBreakdownChart } from "@/components/PaymentBreakdownChart";
import { DollarSign, TrendingUp, ShoppingBag, Percent, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, Customer } from "@shared/schema";
import type { Timeframe } from "@/components/SalesFilters";
import { useMemo, useState } from "react";
import { SalesBuyerTypeChart } from "@/components/SalesBuyerTypeChart";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TopBuyerList } from "@/components/TopBuyerList";
import { useAuth } from "@/contexts/AuthContext";

export default function Sales() {
  const { data: analytics } = useQuery<any>({ queryKey: ["/api/analytics/dashboard"] });
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { user } = useAuth();
  // Top buyer filters
  const [tbFilters, setTbFilters] = useState<{ timeframe: Timeframe | "all"; customerType: string; district: string; thana: string }>({ timeframe: "week", customerType: "All", district: "All", thana: "All" });
  // Full Bangladesh district list
  const bdDistricts = [
    "Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria","Chandpur","Chapainawabganj","Chattogram","Chuadanga","Cox's Bazar","Cumilla","Dhaka","Dinajpur","Faridpur","Feni","Gaibandha","Gazipur","Gopalganj","Habiganj","Jamalpur","Jashore","Jhalokathi","Jhenaidah","Joypurhat","Khagrachhari","Khulna","Kishoreganj","Kurigram","Kushtia","Lakshmipur","Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur","Moulvibazar","Munshiganj","Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi","Natore","Netrakona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali","Pirojpur","Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira","Shariatpur","Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail","Thakurgaon"
  ];
  const districts = useMemo(() => ["All", ...bdDistricts], []);
  // Static thana map (seeded with common thanas). If a district is selected, prefer this map and merge any from customers.
  const bdThanasMap: Record<string, string[]> = {
    Dhaka: ["Dhanmondi","Gulshan","Uttara","Mirpur","Tejgaon","Mohammadpur","Banani","Badda"],
    Chattogram: ["Kotwali","Pahartali","Panchlaish","Halishahar","Chandgaon","Bayazid"],
    Cumilla: ["Kotwali","Debidwar","Daudkandi"],
    Sylhet: ["Kotwali","Jalalabad","Shahporan"],
    Khulna: ["Khalishpur","Sonadanga","Khan Jahan Ali"],
    Rajshahi: ["Boalia","Rajpara","Motihar"],
    Barishal: ["Kotwali","Airport","Banaripara"],
    Rangpur: ["Kotwali","Mahiganj","Haragach"],
    Mymensingh: ["Kotwali","Trishal","Gafargaon"],
  };
  const thanas = useMemo(() => {
    if (tbFilters.district === "All") return ["All"]; // choose a district first
    const preset = bdThanasMap[tbFilters.district] || [];
    const set = new Set<string>(preset);
    for (const c of customers) {
      const d = String((c as any).district || "");
      const t = String((c as any).thana || "");
      if (!t) continue;
      if (d === tbFilters.district) set.add(t);
    }
    return ["All", ...Array.from(set).sort()];
  }, [customers, tbFilters.district]);

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

      {/* Filters UI removed as requested (Timeframe, Customer Type). Using defaults internally. */}

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
        {user?.role === "Admin" && (
          <div className="lg:col-span-2">
            <SalesChart filters={filters} />
          </div>
        )}
        <TopProductsCard />
      </div>

      {user?.role === "Admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentBreakdownChart />
          <SalesBuyerTypeChart filters={filters} />
        </div>
      )}

      {/* Top Buyer Filters */}
      <Card>
        <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Time</Label>
            <Select value={tbFilters.timeframe} onValueChange={(v) => setTbFilters(prev => ({ ...prev, timeframe: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={tbFilters.customerType} onValueChange={(v) => setTbFilters(prev => ({ ...prev, customerType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
                <SelectItem value="Dealer">Dealer</SelectItem>
                <SelectItem value="Depo">Depo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">District</Label>
            <Select value={tbFilters.district} onValueChange={(v) => setTbFilters(prev => ({ ...prev, district: v, thana: "All" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {districts.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Thana</Label>
            <Select value={tbFilters.thana} onValueChange={(v) => setTbFilters(prev => ({ ...prev, thana: v }))} disabled={tbFilters.district === "All" && thanas.length <= 1}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {thanas.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopBuyerList filters={{ timeframe: (tbFilters.timeframe === "all" ? undefined : tbFilters.timeframe) as any, customerType: tbFilters.customerType, district: tbFilters.district, thana: tbFilters.thana }} />
      </div>
    </div>
  );
}
