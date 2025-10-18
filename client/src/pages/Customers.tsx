import { CustomerTable } from "@/components/CustomerTable";
import { StatCard } from "@/components/StatCard";
import { Users, Star, TrendingUp, UserPlus } from "lucide-react";

export default function Customers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground">Manage customer profiles, loyalty points, and purchase history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value="1,234"
          change={{ value: "23", trend: "up" }}
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title="VIP Members"
          value="89"
          change={{ value: "12", trend: "up" }}
          icon={Star}
          iconColor="text-warning"
        />
        <StatCard
          title="Active This Week"
          value="456"
          icon={TrendingUp}
          iconColor="text-success"
        />
        <StatCard
          title="New This Month"
          value="45"
          change={{ value: "8", trend: "up" }}
          icon={UserPlus}
          iconColor="text-info"
        />
      </div>

      <CustomerTable />
    </div>
  );
}
