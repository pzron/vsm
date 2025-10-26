import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { Plus, MinusCircle, ArrowUp, ArrowDown } from "lucide-react";
import { useRef } from "react";

export function ProductDialog({
  trigger,
  product,
}: {
  trigger: React.ReactNode;
  product?: Product | null;
}) {
  const isEdit = !!product;
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    subcategory: "",
    unitType: "pcs",
    description: "",
    imageUrl: "",
    retailPrice: "0",
    wholesalePrice: "",
    vipPrice: "",
    costPrice: "0",
    currentStock: 0,
    minStock: 0,
    expiryDate: "",
    points: 0,
    features: [] as string[],
  });

  const onUploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    setForm((f) => ({ ...f, imageUrl: data.url }));
  };

  useEffect(() => {
    if (product && open) {
      setForm({
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category: product.category || "",
        subcategory: (product as any).subcategory || "",
        unitType: (product as any).unitType || "pcs",
        description: product.description || "",
        imageUrl: (product as any).imageUrl || "",
        retailPrice: String(product.retailPrice ?? "0"),
        wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : "",
        vipPrice: product.vipPrice ? String(product.vipPrice) : "",
        costPrice: String(product.costPrice ?? "0"),
        currentStock: product.currentStock ?? 0,
        minStock: product.minStock ?? 0,
        expiryDate: product.expiryDate ? new Date(product.expiryDate as any).toISOString().slice(0, 10) : "",
        points: (product as any).points ?? 0,
        features: Array.isArray((product as any).features) ? ((product as any).features as string[]) : [],
      });
    }
    if (!product && open) {
      setForm({
        name: "",
        sku: "",
        barcode: "",
        category: "",
        subcategory: "",
        unitType: "pcs",
        description: "",
        imageUrl: "",
        retailPrice: "0",
        wholesalePrice: "",
        vipPrice: "",
        costPrice: "0",
        currentStock: 0,
        minStock: 0,
        expiryDate: "",
        points: 0,
        features: [],
      });
    }
  }, [product, open]);

  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        currentStock: Number(form.currentStock) || 0,
        minStock: Number(form.minStock) || 0,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
        points: Number(form.points) || 0,
        features: (form.features || []).map((s) => String(s).trim()).filter(Boolean),
      } as any;
      if (isEdit && product) {
        await apiRequest("PATCH", `/api/products/${product.id}`, payload);
      } else {
        await apiRequest("POST", "/api/products", payload);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutateAsync();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <div ref={scrollRef} className="max-h-[80vh] overflow-y-auto pr-1">
        <form className="space-y-4 pb-16" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={(e) => setForm(f => ({ ...f, barcode: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Subcategory</Label>
              <Input value={form.subcategory} onChange={(e) => setForm(f => ({ ...f, subcategory: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Unit Type</Label>
              <Select value={form.unitType || 'pcs'} onValueChange={(v) => setForm(f => ({ ...f, unitType: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                  <SelectItem value="pack">pack</SelectItem>
                  <SelectItem value="dozen">dozen</SelectItem>
                  <SelectItem value="custom">custom</SelectItem>
                </SelectContent>
              </Select>
              {form.unitType === 'custom' && (
                <Input className="mt-2" placeholder="Enter custom unit" onChange={(e) => setForm(f => ({ ...f, unitType: e.target.value.trim() || 'custom' }))} />
              )}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Or Upload Image</Label>
              <Input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await onUploadImage(file);
              }} />
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded mt-2" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : null}
            </div>
            <div className="space-y-1">
              <Label>Retail Price</Label>
              <Input type="number" step="0.01" value={form.retailPrice} onChange={(e) => setForm(f => ({ ...f, retailPrice: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Wholesale Price</Label>
              <Input type="number" step="0.01" value={form.wholesalePrice} onChange={(e) => setForm(f => ({ ...f, wholesalePrice: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>VIP Price</Label>
              <Input type="number" step="0.01" value={form.vipPrice} onChange={(e) => setForm(f => ({ ...f, vipPrice: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Cost Price</Label>
              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm(f => ({ ...f, costPrice: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Current Stock</Label>
              <Input type="number" value={form.currentStock} onChange={(e) => setForm(f => ({ ...f, currentStock: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>Min Stock</Label>
              <Input type="number" value={form.minStock} onChange={(e) => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiryDate} onChange={(e) => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Points</Label>
              <Input type="number" value={form.points} onChange={(e) => setForm(f => ({ ...f, points: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Features</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setForm(f => ({ ...f, features: [...(f.features || []), ""] }))}
                  data-testid="button-add-feature"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                {(form.features || []).map((feat, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder={`Feature ${idx + 1}`}
                      value={feat}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        features: f.features.map((v, i) => i === idx ? e.target.value : v),
                      }))}
                      data-testid={`input-feature-${idx}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }))}
                      data-testid={`button-remove-feature-${idx}`}
                    >
                      <MinusCircle className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isEdit ? "Save" : "Create"}</Button>
          </div>
        </form>
        </div>
        {/* Scroll controls */}
        <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col gap-2">
          <Button
            type="button"
            size="icon"
            className="rounded-full shadow pointer-events-auto"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="rounded-full shadow pointer-events-auto"
            onClick={() => scrollRef.current?.scrollTo({ top: (scrollRef.current?.scrollHeight || 0), behavior: 'smooth' })}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
