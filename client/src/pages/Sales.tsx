import { StatCard } from "@/components/StatCard";
import { SalesChart } from "@/components/SalesChart";
import { TopProductsCard } from "@/components/TopProductsCard";
import { PaymentBreakdownChart } from "@/components/PaymentBreakdownChart";
import { DollarSign, TrendingUp, ShoppingBag, Percent } from "lucide-react";

export default function Sales() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Analytics</h1>
        <p className="text-muted-foreground">Track sales performance, revenue, and profit margins</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value="$67,890"
          change={{ value: "12.5%", trend: "up" }}
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Gross Profit"
          value="$29,450"
          change={{ value: "8.2%", trend: "up" }}
          icon={TrendingUp}
          iconColor="text-info"
        />
        <StatCard
          title="Total Orders"
          value="1,234"
          change={{ value: "45", trend: "up" }}
          icon={ShoppingBag}
          iconColor="text-primary"
        />
        <StatCard
          title="Profit Margin"
          value="43.4%"
          change={{ value: "2.1%", trend: "up" }}
          icon={Percent}
          iconColor="text-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <TopProductsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentBreakdownChart />
      </div>
    </div>
  );
}
