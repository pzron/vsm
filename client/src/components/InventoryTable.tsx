import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowUpCircle, ArrowDownCircle, Edit2, Search, Plus } from "lucide-react";
import { useState } from "react";

interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  value: string;
  lastAdjusted: string;
  adjustedBy: string;
}

export function InventoryTable() {
  const [search, setSearch] = useState("");

  // todo: remove mock functionality
  const items: InventoryItem[] = [
    { id: "1", product: "Wireless Mouse", sku: "WM-001", category: "Electronics", currentStock: 45, minStock: 20, value: "$1,349.55", lastAdjusted: "2 hours ago", adjustedBy: "John Doe" },
    { id: "2", product: "USB-C Cable 2m", sku: "UC-002", category: "Accessories", currentStock: 8, minStock: 25, value: "$103.92", lastAdjusted: "1 day ago", adjustedBy: "Jane Smith" },
    { id: "3", product: "Mechanical Keyboard", sku: "MK-003", category: "Electronics", currentStock: 8, minStock: 15, value: "$719.92", lastAdjusted: "3 days ago", adjustedBy: "Mike Chen" },
    { id: "4", product: "Desk Lamp LED", sku: "DL-004", category: "Furniture", currentStock: 0, minStock: 10, value: "$0.00", lastAdjusted: "1 week ago", adjustedBy: "Sarah Johnson" },
  ];

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (current < min) return { label: "Low Stock", variant: "outline" as const, color: "bg-warning/10 text-warning border-warning/20" };
    return { label: "In Stock", variant: "secondary" as const };
  };

  return (
    <div className="space-y-4" data-testid="inventory-table">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-inventory"
          />
        </div>
        <Button variant="outline" data-testid="button-stock-in">
          <ArrowUpCircle className="h-4 w-4 mr-2" />
          Stock In
        </Button>
        <Button variant="outline" data-testid="button-stock-out">
          <ArrowDownCircle className="h-4 w-4 mr-2" />
          Stock Out
        </Button>
        <Button data-testid="button-adjust-stock">
          <Edit2 className="h-4 w-4 mr-2" />
          Adjust Stock
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Min Stock</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Adjusted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const status = getStockStatus(item.currentStock, item.minStock);
              return (
                <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="font-mono font-semibold">{item.currentStock}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{item.minStock}</TableCell>
                  <TableCell className="font-mono">{item.value}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={status.color}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-muted-foreground">{item.lastAdjusted}</div>
                      <div className="text-xs text-muted-foreground">by {item.adjustedBy}</div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
