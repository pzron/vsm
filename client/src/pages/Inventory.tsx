import { InventoryTable } from "@/components/InventoryTable";

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">Track stock levels, manage adjustments, and monitor inventory value</p>
      </div>
      <InventoryTable />
    </div>
  );
}
