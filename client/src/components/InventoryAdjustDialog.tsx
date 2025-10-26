import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product, InventoryAdjustment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

export function InventoryAdjustDialog({
  trigger,
  defaultType,
}: {
  trigger: React.ReactNode;
  defaultType?: "Stock In" | "Stock Out" | "Adjust";
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"Stock In" | "Stock Out" | "Adjust">(defaultType || "Adjust");
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [newStock, setNewStock] = useState<number | "">("");
  const [reason, setReason] = useState<string>("");
  const { user } = useAuth();

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const selected = useMemo(() => products.find(p => p.id === productId), [products, productId]);
  const [barcode, setBarcode] = useState("");

  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select a product");
      const previousStock = selected.currentStock;
      let computedNewStock = previousStock;
      if (type === "Stock In") computedNewStock = previousStock + (quantity || 0);
      else if (type === "Stock Out") computedNewStock = previousStock - (quantity || 0);
      else if (type === "Adjust") computedNewStock = typeof newStock === "number" ? newStock : previousStock;

      const payload: Partial<InventoryAdjustment> & {
        productId: string; productName: string; type: string; quantity: number; previousStock: number; newStock: number; adjustedBy: string; adjustedByName: string;
      } = {
        productId: selected.id,
        productName: selected.name,
        type,
        quantity: type === "Adjust" ? Math.abs((computedNewStock - previousStock)) : (quantity || 0),
        previousStock,
        newStock: computedNewStock,
        reason,
        adjustedBy: user?.id || "system",
        adjustedByName: user?.fullName || "System",
      } as any;

      await apiRequest("POST", "/api/inventory/adjustments", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/inventory/adjustments"] }),
      ]);
      setOpen(false);
      setProductId("");
      setQuantity(0);
      setNewStock("");
      setReason("");
      setType(defaultType || "Adjust");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inventory Adjustment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stock In">Stock In</SelectItem>
                <SelectItem value="Stock Out">Stock Out</SelectItem>
                <SelectItem value="Adjust">Adjust</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Scan/Type Barcode</Label>
                <Input
                  placeholder="Scan or enter barcode"
                  value={barcode}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBarcode(v);
                    const found = products.find(p => (p.barcode || "") === v);
                    if (found) setProductId(found.id);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Reason</Label>
                <Textarea placeholder="Optional note" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>
          </div>

          {selected ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label>Current Stock</Label>
                <div className="font-mono">{selected.currentStock}</div>
              </div>
              <div>
                <Label>Min Stock</Label>
                <div className="font-mono text-muted-foreground">{selected.minStock}</div>
              </div>
              {selected.expiryDate ? (
                <div className="col-span-2 text-xs text-muted-foreground">
                  Expiry: {new Date(selected.expiryDate as any).toLocaleDateString()}
                </div>
              ) : null}
            </div>
          ) : null}

          {type === "Adjust" ? (
            <div className="space-y-2">
              <Label>New Stock</Label>
              <Input type="number" value={newStock as any} onChange={(e) => setNewStock(Number(e.target.value))} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
          )}

          

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={isPending || !productId} onClick={() => mutateAsync()}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
