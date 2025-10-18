import { ReportsFilters } from "@/components/ReportsFilters";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { RevenueChart } from "@/components/RevenueChart";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate custom reports with advanced filters and export options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ReportsFilters />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <RevenueChart />
          <CategoryPieChart title="Revenue by Category" />
        </div>
      </div>
    </div>
  );
}
