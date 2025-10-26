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
import { Edit, Trash2, Search, Plus, ShoppingCart, Minus, Plus as PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product, Customer } from "@shared/schema";
import { ProductDialog } from "@/components/ProductDialog";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

export function ProductsTable() {
  const [search, setSearch] = useState("");
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", search ? `?search=${search}` : ""],
  });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  // Quick invoice state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  const [cart, setCart] = useState<Record<string, number>>({}); // productId -> qty

  const cartCount = useMemo(() => Object.values(cart).reduce((a,b)=>a+b,0), [cart]);
  const addToCart = (pid: string) => setCart(prev => ({ ...prev, [pid]: (prev[pid] || 0) + 1 }));
  const decFromCart = (pid: string) => setCart(prev => {
    const qty = (prev[pid] || 0) - 1; const next = { ...prev } as Record<string, number>;
    if (qty <= 0) delete next[pid]; else next[pid] = qty; return next;
  });
  const removeFromCart = (pid: string) => setCart(prev => { const n = { ...prev }; delete n[pid]; return n; });

  const priceForCustomer = (p?: Product | undefined) => {
    if (!p) return 0;
    const t = (selectedCustomer?.type || "Retail").toLowerCase();
    if (t === "wholesale" && p.wholesalePrice) return parseFloat(String(p.wholesalePrice));
    if (t === "vip" && p.vipPrice) return parseFloat(String(p.vipPrice));
    return parseFloat(String(p.retailPrice || 0));
  };

  const cartSubtotal = useMemo(() => {
    let sum = 0;
    for (const [pid, qty] of Object.entries(cart)) {
      const p = (products || []).find(pp => pp.id === pid);
      sum += (priceForCustomer(p) * qty);
    }
    return sum;
  }, [cart, products, selectedCustomerId]);

  const [, setLocation] = useLocation();
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("search") || "";
      setSearch(s);
    } catch {}
  }, []);
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const itemsParam = Object.entries(cart).map(([pid, qty]) => `${pid}:${qty}`).join(",");
      const custParam = selectedCustomerId ? `&customerId=${encodeURIComponent(selectedCustomerId)}` : "";
      setLocation(`/invoicing?items=${encodeURIComponent(itemsParam)}${custParam}`);
    },
    onSuccess: async () => {
      setCart({});
      setSelectedCustomerId("");
    },
  });

  const formatCurrency = (value: string | null) => {
    if (!value) return "$0.00";
    const num = parseFloat(value);
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-4" data-testid="products-table">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-products"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="w-56" data-testid="select-products-customer">
              <SelectValue placeholder="Select customer (optional)" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={cartCount === 0}
            onClick={() => createInvoiceMutation.mutate()}
            data-testid="button-create-invoice-from-products"
          >
            <ShoppingCart className="h-4 w-4 mr-2" /> Create Invoice ({cartCount})
          </Button>
        </div>
        {hasPermission("Products", "add") && (
          <ProductDialog
            trigger={
              <Button data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            }
          />
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-9" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                  <TableCell>
                    {Boolean((product as any).imageUrl) ? (
                      <img
                        src={(product as any).imageUrl as any}
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={product.currentStock === 0 ? "destructive" : product.currentStock < product.minStock ? "outline" : "secondary"}
                      className={product.currentStock < product.minStock && product.currentStock > 0 ? "bg-warning/10 text-warning border-warning/20" : ""}
                    >
                      {product.currentStock}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{formatCurrency(product.retailPrice)}</TableCell>
                  <TableCell>{(product as any).points ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={product.currentStock > 0 ? "default" : "secondary"}>
                      {product.currentStock > 0 ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <div className="flex items-center gap-1 mr-3">
                        <Button size="icon" variant="ghost" onClick={() => decFromCart(product.id)} aria-label="decrement">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[2ch] text-center text-sm font-mono">{cart[product.id] || 0}</div>
                        <Button size="icon" variant="ghost" onClick={() => addToCart(product.id)} aria-label="increment">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      {hasPermission("Products", "edit") && (
                        <ProductDialog
                          product={product}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                      )}
                      {hasPermission("Products", "delete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-delete-${product.id}`}
                          onClick={async () => {
                            if (!confirm("Delete this product?")) return;
                            await apiRequest("DELETE", `/api/products/${product.id}`);
                            await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
