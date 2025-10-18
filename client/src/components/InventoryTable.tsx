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
import { ArrowUpCircle, ArrowDownCircle, Edit2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export function InventoryTable() {
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

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
                        <div className="text-xs text-muted-foreground">by System</div>
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
