import { StatCard } from "../StatCard";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
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
  );
}
