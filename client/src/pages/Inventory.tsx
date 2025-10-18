import { InventoryTable } from "@/components/InventoryTable";
import { StatCard } from "@/components/StatCard";
import { Package, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">Track stock levels, manage adjustments, and monitor inventory value</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value="856"
          icon={Package}
          iconColor="text-primary"
        />
        <StatCard
          title="Low Stock"
          value="12"
          icon={AlertTriangle}
          iconColor="text-warning"
        />
        <StatCard
          title="Out of Stock"
          value="4"
          icon={TrendingDown}
          iconColor="text-destructive"
        />
        <StatCard
          title="Inventory Value"
          value="$45,890"
          icon={DollarSign}
          iconColor="text-success"
        />
      </div>

      <InventoryTable />
    </div>
  );
}
