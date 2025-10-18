import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { LowStockAlert } from "@/components/LowStockAlert";
import { TopBuyerCard } from "@/components/TopBuyerCard";
import { QuickActions } from "@/components/QuickActions";
import { StaffActivityLog } from "@/components/StaffActivityLog";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value="$12,450"
          change={{ value: "15.2%", trend: "up" }}
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Invoices"
          value="48"
          change={{ value: "8", trend: "up" }}
          icon={ShoppingCart}
          iconColor="text-info"
        />
        <StatCard
          title="Low Stock Items"
          value="12"
          icon={Package}
          iconColor="text-warning"
        />
        <StatCard
          title="Total Customers"
          value="1,234"
          change={{ value: "23", trend: "up" }}
          icon={Users}
          iconColor="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart />
        <CategoryPieChart title="Payment Breakdown" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LowStockAlert />
        <TopBuyerCard />
        <StaffActivityLog />
      </div>
    </div>
  );
}
