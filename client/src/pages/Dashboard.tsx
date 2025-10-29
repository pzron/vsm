import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { LowStockAlert } from "@/components/LowStockAlert";
import { TopBuyerCard } from "@/components/TopBuyerCard";
import { QuickActions } from "@/components/QuickActions";
import { StaffActivityLog } from "@/components/StaffActivityLog";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, Briefcase, AlertTriangle, PackageX, Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      marquee: any;
    }
  }
}

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
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  // Simplified search: default to products

  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    setLocation(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with welcome + marquee left, search on right */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 via-emerald-500 to-sky-500 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>
          {/* Marquee banner */}
          <div className="rounded border bg-muted/30 flex-1 min-w-0">
            <div className="flex items-center gap-2 px-2">
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-fuchsia-500" />
              <marquee behavior="scroll" direction="left" className="py-2 text-xs md:text-sm text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-amber-500 to-sky-500 font-medium">
                {isLoading || !analytics
                  ? "Loading analytics..."
                  : `Low stock: ${analytics.lowStockCount} | Out of stock: ${analytics.outOfStockCount} | Total revenue: ${formatCurrency(analytics.totalRevenue)} | Total customers: ${formatNumber(analytics.totalCustomers)}`}
              </marquee>
            </div>
          </div>
        </div>
        {/* Search bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, customers, staff..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
              className="pl-9"
              data-testid="input-dashboard-search"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
            {user?.role === "Admin" && (
              <>
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(analytics.totalRevenue)}
                  icon={DollarSign}
                  iconColor="text-success"
                  variant="green"
                  live
                />
                <StatCard
                  title="Total Profit"
                  value={formatCurrency(analytics.totalProfit)}
                  icon={TrendingUp}
                  iconColor="text-success"
                  variant="purple"
                />
                {(() => {
                  try {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    let revenue = 0;
                    let profit = 0;
                    for (const inv of invoices) {
                      const created = new Date(inv.createdAt as any);
                      if (created >= today && created < tomorrow) {
                        revenue += parseFloat(inv.total as string);
                        const items = (inv.items as any[]) || [];
                        profit += items.reduce((sum, it) => sum + (parseFloat(it.price) - parseFloat(it.costPrice || "0")) * (it.quantity || 0), 0);
                      }
                    }
                    const todaysEarnings = profit; // revenue - cost already represented by profit
                    return (
                      <StatCard
                        title="Today's Earnings"
                        value={formatCurrency(todaysEarnings)}
                        icon={DollarSign}
                        iconColor="text-warning"
                        variant="orange"
                        live
                      />
                    );
                  } catch {
                    return null;
                  }
                })()}
              </>
            )}
            {user?.role === "Admin" ? (
              <StatCard
                title="Total Invoices"
                value={formatNumber(analytics.totalInvoices)}
                icon={ShoppingCart}
                iconColor="text-info"
                variant="blue"
              />
            ) : (
              (() => {
                try {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  let count = 0;
                  for (const inv of invoices) {
                    const created = new Date(inv.createdAt as any);
                    if (created >= today && created < tomorrow) count += 1;
                  }
                  return (
                    <StatCard
                      title="Today Invoices"
                      value={formatNumber(count)}
                      icon={ShoppingCart}
                      iconColor="text-info"
                      variant="blue"
                    />
                  );
                } catch {
                  return null;
                }
              })()
            )}
            <StatCard
              title="Total Products"
              value={formatNumber(analytics.totalProducts)}
              icon={Package}
              iconColor="text-primary"
              variant="teal"
            />
            {user?.role === "Admin" && (
              <>
                <StatCard
                  title="Total Customers"
                  value={formatNumber(analytics.totalCustomers)}
                  icon={Users}
                  iconColor="text-primary"
                  variant="pink"
                />
                <StatCard
                  title="Total Staff"
                  value={formatNumber(analytics.totalStaff)}
                  icon={Briefcase}
                  iconColor="text-info"
                  variant="purple"
                />
              </>
            )}
            <StatCard
              title="Low Stock Items"
              value={formatNumber(analytics.lowStockCount)}
              icon={AlertTriangle}
              iconColor="text-warning"
              variant="orange"
            />
            <StatCard
              title="Out of Stock"
              value={formatNumber(analytics.outOfStockCount)}
              icon={PackageX}
              iconColor="text-destructive"
              variant="red"
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {user?.role === "Admin" && (
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
        )}
        <QuickActions />
      </div>

      {user?.role === "Admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryPieChart />
          <CategoryPieChart title="Payment Breakdown" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LowStockAlert />
        <TopBuyerCard />
        {user?.role === "Admin" && <StaffActivityLog />}
      </div>
    </div>
  );
}
