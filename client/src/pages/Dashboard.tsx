import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { LowStockAlert } from "@/components/LowStockAlert";
import { TopBuyerCard } from "@/components/TopBuyerCard";
import { QuickActions } from "@/components/QuickActions";
import { StaffActivityLog } from "@/components/StaffActivityLog";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, Briefcase, AlertTriangle, PackageX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DashboardAnalytics {
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  totalProfit: number;
  totalInvoices: number;
  totalStaff: number;
  lowStockCount: number;
  outOfStockCount: number;
}

function StatCardSkeleton() {
  return (
    <Card data-testid="card-stat-skeleton">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-32 mb-1" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : analytics ? (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(analytics.totalRevenue)}
              icon={DollarSign}
              iconColor="text-success"
            />
            <StatCard
              title="Total Profit"
              value={formatCurrency(analytics.totalProfit)}
              icon={TrendingUp}
              iconColor="text-success"
            />
            <StatCard
              title="Total Invoices"
              value={formatNumber(analytics.totalInvoices)}
              icon={ShoppingCart}
              iconColor="text-info"
            />
            <StatCard
              title="Total Products"
              value={formatNumber(analytics.totalProducts)}
              icon={Package}
              iconColor="text-primary"
            />
            <StatCard
              title="Total Customers"
              value={formatNumber(analytics.totalCustomers)}
              icon={Users}
              iconColor="text-primary"
            />
            <StatCard
              title="Total Staff"
              value={formatNumber(analytics.totalStaff)}
              icon={Briefcase}
              iconColor="text-info"
            />
            <StatCard
              title="Low Stock Items"
              value={formatNumber(analytics.lowStockCount)}
              icon={AlertTriangle}
              iconColor="text-warning"
            />
            <StatCard
              title="Out of Stock"
              value={formatNumber(analytics.outOfStockCount)}
              icon={PackageX}
              iconColor="text-destructive"
            />
          </>
        ) : null}
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
