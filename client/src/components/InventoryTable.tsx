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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpCircle, ArrowDownCircle, Edit2, Search, FileText, AlertTriangle, Bell, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Product, InventoryAdjustment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { InventoryAdjustDialog } from "@/components/InventoryAdjustDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { InventoryReportDialog } from "@/components/InventoryReportDialog";

export function InventoryTable() {
  const [search, setSearch] = useState("");
  const { hasPermission } = useAuth();
  const [, setLocation] = useLocation();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  const { data: adjustments = [] } = useQuery<InventoryAdjustment[]>({ queryKey: ["/api/inventory/adjustments"] });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!search) return products;
    
    const searchLower = search.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
    );
  }, [products, search]);

  const formatCurrency = (value: string | null) => {
    if (!value) return "$0.00";
    const num = parseFloat(value);
    return `$${num.toFixed(2)}`;
  };

  const calculateValue = (currentStock: number, retailPrice: string | null) => {
    if (!retailPrice) return "$0.00";
    const price = parseFloat(retailPrice);
    const total = currentStock * price;
    return `$${total.toFixed(2)}`;
  };

  const getLastAdjusted = (createdAt: Date, updatedAt: Date) => {
    const date = updatedAt || createdAt;
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (current < min) return { label: "Low Stock", variant: "outline" as const, color: "bg-warning/10 text-warning border-warning/20" };
    return { label: "In Stock", variant: "secondary" as const };
  };

  // Alerts & valuation
  const lowStockCount = useMemo(() => (products || []).filter(p => p.currentStock < p.minStock).length, [products]);
  const expirySoonCount = useMemo(() => (products || []).filter(p => p.expiryDate && ((new Date(p.expiryDate as any).getTime() - Date.now())/(1000*60*60*24)) <= 30 && ((new Date(p.expiryDate as any).getTime() - Date.now())/(1000*60*60*24)) >= 0).length, [products]);
  const totalCostValuation = useMemo(() => (products || []).reduce((sum, p) => sum + (p.currentStock || 0) * parseFloat(String(p.costPrice || "0")), 0), [products]);
  const categoryValuation = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products || []) {
      const cat = p.category || "";
      const val = (p.currentStock || 0) * parseFloat(String(p.costPrice || "0"));
      map.set(cat, (map.get(cat) || 0) + val);
    }
    return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
  }, [products]);

  // Last adjustment per product
  const lastAdjustmentByProduct = useMemo(() => {
    const map = new Map<string, { when: string; by: string; reason?: string }>();
    for (const a of adjustments) {
      const prev = map.get(a.productId);
      const current = new Date(a.createdAt as any).toISOString();
      if (!prev || current > prev.when) {
        map.set(a.productId, { when: current, by: a.adjustedByName, reason: a.reason || undefined });
      }
    }
    return map;
  }, [adjustments]);

  return (
    <div className="space-y-4" data-testid="inventory-table">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Bell className="h-4 w-4" />Low Stock</div>
          <div className="font-mono font-semibold">{lowStockCount}</div>
        </div>
        <div className="p-3 rounded border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" />Expiry Soon (30d)</div>
          <div className="font-mono font-semibold">{expirySoonCount}</div>
        </div>
        <div className="p-3 rounded border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Total Inventory Value (Cost)</div>
          <div className="font-mono font-semibold">${totalCostValuation.toFixed(2)}</div>
        </div>
      </div>
      {categoryValuation.length > 0 && (
        <div className="rounded border p-3">
          <div className="text-sm font-medium mb-2">Category-wise Inventory Value (Cost)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            {categoryValuation.map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-muted-foreground">{cat || 'Uncategorized'}</span>
                <span className="font-mono">${val.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
        {hasPermission("Inventory", "add") && (
          <InventoryAdjustDialog
            defaultType="Stock In"
            trigger={
              <Button variant="outline" data-testid="button-stock-in">
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Stock In
              </Button>
            }
          />
        )}
        {hasPermission("Inventory", "add") && (
          <InventoryAdjustDialog
            defaultType="Stock Out"
            trigger={
              <Button variant="outline" data-testid="button-stock-out">
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Stock Out
              </Button>
            }
          />
        )}
        {hasPermission("Inventory", "edit") && (
          <InventoryAdjustDialog
            defaultType="Adjust"
            trigger={
              <Button data-testid="button-adjust-stock">
                <Edit2 className="h-4 w-4 mr-2" />
                Adjust Stock
              </Button>
            }
          />
        )}
        <InventoryReportDialog
          trigger={
            <Button variant="outline" data-testid="button-inventory-reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          }
        />
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                </TableRow>
              ))
            ) : filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((item) => {
                const status = getStockStatus(item.currentStock, item.minStock);
                return (
                  <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="font-mono font-semibold">{item.currentStock}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{item.minStock}</TableCell>
                    <TableCell className="font-mono">{calculateValue(item.currentStock, item.retailPrice)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={status.color}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-muted-foreground">{getLastAdjusted(item.createdAt, item.updatedAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {lastAdjustmentByProduct.get(item.id)?.by ? `by ${lastAdjustmentByProduct.get(item.id)?.by}` : "by System"}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {search ? "No inventory items found matching your search." : "No inventory items available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
