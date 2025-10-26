import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, ScanLine, Search, RotateCcw, CreditCard, Smartphone, DollarSign, Landmark, Coins, ArrowUp, ArrowDown, StickyNote } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Customer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { CustomerDialog } from "@/components/CustomerDialog";

interface InvoiceItemRow {
  id: string;
  productId: string;
  qty: number;
  price: number; // unit price before per-line discount
  discountPct?: number; // optional per-line discount %
  note?: string;
}

export function InvoiceForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [customerIdInput, setCustomerIdInput] = useState<string>("");
  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      ((c as any).username || "").toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const [items, setItems] = useState<InvoiceItemRow[]>([
    { id: "1", productId: "", qty: 1, price: 0, discountPct: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(10);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const initializedFromQuery = useRef(false);
  const [note, setNote] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [barcode, setBarcode] = useState("");
  const [payments, setPayments] = useState<{ method: string; amount: number; ref?: string }[]>([
    { method: (selectedCustomer as any)?.preferredPayment || "Cash", amount: 0 },
  ]);
  const [autoUsePoints, setAutoUsePoints] = useState(true);
  const [storeInfo, setStoreInfo] = useState<{ name?: string; address?: string; phone?: string; email?: string; logo?: string }>({});
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([]);
  const [expandNotes, setExpandNotes] = useState<Record<string, boolean>>({});

  const priceForCustomer = (p?: Product | undefined) => {
    if (!p) return 0;
    const t = (selectedCustomer?.type || "Retail").toLowerCase();
    if (t === "wholesale" && p.wholesalePrice) return parseFloat(String(p.wholesalePrice));
    if (t === "vip" && p.vipPrice) return parseFloat(String(p.vipPrice));
    return parseFloat(String(p.retailPrice || 0));
  };

  const effectiveUnit = (it: InvoiceItemRow) => {
    const d = Math.max(0, Math.min(100, Number(it.discountPct || 0)));
    return (Number(it.price) || 0) * (1 - d / 100);
  };
  const subtotal = items.reduce((sum, item) => sum + item.qty * effectiveUnit(item), 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxBase * tax) / 100;
  const grossTotal = taxBase + taxAmount;
  const usablePoints = Math.max(0, Math.min(selectedCustomer?.loyaltyPoints || 0, redeemPoints || 0));
  const total = Math.max(0, grossTotal - usablePoints);
  const totalPayments = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const balance = Math.max(0, total - totalPayments);
  const change = Math.max(0, totalPayments - total);

  const earnedPoints = useMemo(() => {
    let sum = 0;
    for (const it of items) {
      const p = products.find(pr => pr.id === it.productId);
      if (p && (p as any).points != null) sum += ((p as any).points || 0) * it.qty;
    }
    if (sum === 0) sum = Math.floor(total / 10);
    return sum;
  }, [items, products, total]);

  const printInvoiceNumber = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `INV-${y}${m}${day}-${String(Date.now()).slice(-6)}`;
  }, []);

  const productById = useMemo(() => {
    const map: Record<string, Product> = {} as any;
    for (const p of products) map[p.id] = p;
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode || "").toLowerCase().includes(q)
    );
  }, [products, productFilter]);

  // Load store info/logo for template header
  useEffect(() => {
    try {
      const raw = localStorage.getItem("settings_store");
      if (raw) {
        const s = JSON.parse(raw);
        setStoreInfo({ name: s.name, address: s.address, phone: s.phone, email: s.email, logo: s.logo });
      }
    } catch {}
  }, []);

  // Recompute item prices if customer type changes
  useEffect(() => {
    setItems(prev => prev.map(it => {
      if (!it.productId) return it;
      const p = products.find(pp => pp.id === it.productId);
      return { ...it, price: priceForCustomer(p) };
    }));
    // Auto-apply customer-type default discount
    const t = (selectedCustomer?.type || "Retail").toLowerCase();
    const defaults: Record<string, number> = { retail: 0, wholesale: 5, vip: 10, member: 2, depo: 0 };
    setDiscount(defaults[t] ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  // Auto use loyalty points if enabled
  useEffect(() => {
    if (!autoUsePoints) return;
    const lp = selectedCustomer?.loyaltyPoints || 0;
    // compute based on current gross total before redemption
    const gross = taxBase + taxAmount;
    const use = Math.min(lp, Math.floor(gross));
    setRedeemPoints(use);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId, subtotal, discount, tax, taxAmount, taxBase, autoUsePoints]);

  // Prefill from query params (items and optional customerId)
  useEffect(() => {
    if (initializedFromQuery.current) return;
    if (!products || products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const itemsParam = params.get("items");
    const customerParam = params.get("customerId");
    if (!itemsParam && !customerParam) return;
    if (customerParam) {
      const exists = customers.some(c => c.id === customerParam);
      if (exists) setSelectedCustomerId(customerParam);
    }
    if (itemsParam) {
      const pairs = decodeURIComponent(itemsParam).split(",").map(s => s.trim()).filter(Boolean);
      const rows: InvoiceItemRow[] = [];
      let rowId = 1;
      for (const pair of pairs) {
        const [pid, qtyStr] = pair.split(":");
        const qty = Math.max(1, Number(qtyStr) || 1);
        const p = products.find(pr => pr.id === pid);
        if (!p) continue;
        rows.push({ id: String(rowId++), productId: pid, qty, price: priceForCustomer(p) });
      }
      if (rows.length) setItems(rows);
    }
    initializedFromQuery.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, customers]);

  // Helpers
  const addProductById = (pid: string) => {
    const p = products.find(pp => pp.id === pid);
    if (!p) return;
    setItems(prev => {
      // if already exists, increment qty
      const existing = prev.find(it => it.productId === pid);
      if (existing) {
        return prev.map(it => it.productId === pid ? { ...it, qty: clampQty(pid, it.qty + 1) } : it);
      }
      return [...prev, { id: Date.now().toString(), productId: pid, qty: 1, price: priceForCustomer(p), discountPct: 0 }];
    });
  };

  const clampQty = (pid: string, qty: number) => {
    const p = products.find(pp => pp.id === pid);
    if (!p) return Math.max(1, qty);
    const max = Math.max(0, p.currentStock || 0);
    return Math.max(1, Math.min(qty, max || qty));
  };

  // Quick add by barcode
  useEffect(() => {
    if (!barcode) return;
    const found = products.find(p => (p.barcode || "") === barcode);
    if (found) {
      addProductById(found.id);
      setBarcode("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), productId: "", qty: 1, price: 0, discountPct: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems(prev => {
      const next = prev.slice();
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const statusRef = useRef<"Draft" | "Completed">("Completed");
  const saveMutation = useMutation({
    mutationFn: async () => {
      const availablePoints = selectedCustomer?.loyaltyPoints || 0;
      const pointsPaymentAmount = payments.find(p => p.method === "Points")?.amount || 0;
      const redeem = Math.max(0, Math.min(Math.floor(taxBase + taxAmount), Math.min(pointsPaymentAmount, availablePoints)));
      const finalTotal = Math.max(0, (taxBase + taxAmount) - redeem);
      const payload = {
        invoiceNumber: `INV-${Date.now()}`,
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer?.name || undefined,
        staffId: user?.id || "system",
        staffName: user?.fullName || "System",
        items: items
          .filter(i => i.productId && i.qty > 0)
          .map(i => ({
            productId: i.productId,
            price: effectiveUnit(i).toFixed(2),
            quantity: i.qty,
            costPrice: products.find(p => p.id === i.productId)?.costPrice || "0",
          })),
        subtotal: subtotal.toFixed(2),
        taxRate: tax.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        total: finalTotal.toFixed(2),
        payments: payments.map(p => ({ method: p.method, amount: (Number(p.amount) || 0).toFixed(2) })),
        status: statusRef.current,
        redeemPoints: redeem,
      } as any;
      await apiRequest("POST", "/api/invoices", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
      ]);
      // reset form
      setSelectedCustomerId("");
      setItems([{ id: "1", productId: "", qty: 1, price: 0 }]);
      setDiscount(0);
      setTax(10);
      setRedeemPoints(0);
      setPayments([{ method: (selectedCustomer as any)?.preferredPayment || "Cash", amount: 0 }]);
      setNote("");
    },
  });

  return (
    <>
    <Card data-testid="card-invoice-form" className="print:hidden">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">New Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-500 rounded" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {storeInfo.logo ? (
              <img src={storeInfo.logo} alt="Store Logo" className="h-14 w-14 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : null}
            <div className="text-sm">
              <div className="font-semibold text-lg">{storeInfo.name || "Store"}</div>
              {storeInfo.address ? <div className="text-muted-foreground">{storeInfo.address}</div> : null}
              {(storeInfo.phone || storeInfo.email || (storeInfo as any).website) ? (
                <div className="text-muted-foreground">
                  {storeInfo.phone}
                  {storeInfo.phone && (storeInfo.email || (storeInfo as any).website) ? " · " : ""}
                  {storeInfo.email}
                  {(storeInfo as any).website ? `${storeInfo.email ? " · " : ""}${(storeInfo as any).website}` : ""}
                </div>
              ) : null}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">Invoice</div>
            <div className="text-muted-foreground">Date: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-pink-500 to-purple-600 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger id="customer" data-testid="select-customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 sticky top-0 bg-popover z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-7 h-8"
                      placeholder="Search name, phone, or ID"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                </div>
                {filteredCustomers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between pt-1">
              <CustomerDialog
                trigger={<Button type="button" size="sm" variant="outline">New Customer</Button>}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto use points</span>
                <Switch checked={autoUsePoints} onCheckedChange={setAutoUsePoints} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              <div className="md:col-span-2">
                <Input
                  placeholder="Paste user ID or username"
                  value={customerIdInput}
                  onChange={(e) => setCustomerIdInput(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button type="button" variant="secondary" onClick={() => {
                const id = customerIdInput.trim();
                if (!id) return;
                const byId = customers.find(c => c.id === id);
                const byUname = customers.find(c => ((c as any).username || "") === id);
                const chosen = byId || byUname;
                if (chosen) { setSelectedCustomerId(chosen.id); setCustomerSearch(""); }
              }}>Use ID</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salesperson">Salesperson</Label>
            <Input id="salesperson" value={user?.fullName || "System"} readOnly />
          </div>
        </div>

        {/* Quick add */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Quick Add (Search)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Type product name or SKU and press Enter"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = productQuery.toLowerCase();
                    const found = products.find(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
                    if (found) addProductById(found.id);
                    setProductQuery("");
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Barcode</Label>
            <div className="relative">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Scan barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Actions</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                setItems([{ id: "1", productId: "", qty: 1, price: 0 }]);
                setProductQuery(""); setBarcode(""); setDiscount(0); setTax(10); setRedeemPoints(0);
              }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Items</Label>
            <Button size="sm" variant="outline" onClick={addItem} data-testid="button-add-item">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end" data-testid={`invoice-item-${index}`}>
              <div className="sm:col-span-5 space-y-1">
                <Label className="text-xs">Product</Label>
                <Select value={item.productId} onValueChange={(pid) => {
                  const p = products.find(pp => pp.id === pid)!;
                  setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, productId: pid, price: priceForCustomer(p), qty: clampQty(pid, it.qty || 1) } : it));
                }}>
                  <SelectTrigger data-testid={`input-product-${index}`}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 sticky top-0 bg-popover z-10">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-7 h-8"
                          placeholder="Search name, SKU, or barcode"
                          value={productFilter}
                          onChange={(e) => setProductFilter(e.target.value)}
                        />
                      </div>
                    </div>
                    {filteredProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {item.productId ? (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>SKU: {products.find(p => p.id === item.productId)?.sku}</span>
                    <span>·</span>
                    <span>Stock: {products.find(p => p.id === item.productId)?.currentStock ?? 0}</span>
                  </div>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  value={item.qty}
                  onChange={(e) => setItems(prev => prev.map(it => it.id === item.id ? { ...it, qty: clampQty(it.productId, Number(e.target.value)) } : it))}
                  data-testid={`input-qty-${index}`}
                />
                <div className="flex gap-1 pt-1">
                  <Button size="icon" variant="ghost" onClick={() => setItems(prev => prev.map(it => it.id === item.id ? { ...it, qty: clampQty(it.productId, (it.qty || 1) - 1) } : it))}><RotateCcw className="h-4 w-4 rotate-180" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setItems(prev => prev.map(it => it.id === item.id ? { ...it, qty: clampQty(it.productId, (it.qty || 0) + 1) } : it))}><Plus className="h-4 w-4" /></Button>
                </div>
                {item.productId && (products.find(p => p.id === item.productId)?.currentStock ?? 0) < item.qty ? (
                  <div className="text-[11px] text-destructive">Exceeds stock</div>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Price</Label>
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => setItems(prev => prev.map(it => it.id === item.id ? { ...it, price: Number(e.target.value) } : it))}
                  data-testid={`input-price-${index}`}
                />
                <div className="text-[11px] text-muted-foreground">Line: ${(effectiveUnit(item) * item.qty).toFixed(2)}</div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Line Disc %</Label>
                <Input type="number" value={item.discountPct || 0} onChange={(e) => setItems(prev => prev.map(it => it.id === item.id ? { ...it, discountPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) } : it))} />
                <div className="text-[11px] text-muted-foreground">Unit: {effectiveUnit(item).toFixed(2)}</div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Tier</Label>
                <div className="flex gap-1 flex-wrap">
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    const p = products.find(pp => pp.id === item.productId);
                    if (!p) return;
                    setItems(prev => prev.map(it => it.id === item.id ? { ...it, price: parseFloat(String(p.retailPrice || 0)) } : it));
                  }}>Retail</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    const p = products.find(pp => pp.id === item.productId);
                    if (!p) return;
                    if (p.vipPrice) setItems(prev => prev.map(it => it.id === item.id ? { ...it, price: parseFloat(String(p.vipPrice)) } : it));
                  }}>VIP</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    const p = products.find(pp => pp.id === item.productId);
                    if (!p) return;
                    if (p.wholesalePrice) setItems(prev => prev.map(it => it.id === item.id ? { ...it, price: parseFloat(String(p.wholesalePrice)) } : it));
                  }}>Whole</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => {
                    const p = products.find(pp => pp.id === item.productId);
                    if (!p) return;
                    setItems(prev => prev.map(it => it.id === item.id ? { ...it, price: priceForCustomer(p) } : it));
                  }}>Auto</Button>
                </div>
                {(() => {
                  const p = products.find(pp => pp.id === item.productId);
                  const cost = p ? parseFloat(String(p.costPrice || 0)) : 0;
                  const margin = (effectiveUnit(item) - cost) * (item.qty || 0);
                  const cls = margin >= 0 ? "text-emerald-600" : "text-destructive";
                  return <div className={`text-[11px] ${cls}`}>Margin: {margin.toFixed(2)}</div>;
                })()}
              </div>
              <div className="sm:col-span-1 flex gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => moveItem(index, -1)} aria-label="move up"><ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => moveItem(index, 1)} aria-label="move down"><ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setExpandNotes(prev => ({ ...prev, [item.id]: !prev[item.id] }))} aria-label="note"><StickyNote className="h-4 w-4" /></Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  data-testid={`button-remove-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => {
                  setItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
                }} aria-label="duplicate">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => {
                  setItems(prev => prev.map(it => it.id === item.id ? { id: item.id, productId: "", qty: 1, price: 0, discountPct: 0 } : it));
                }} aria-label="clear">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {expandNotes[item.id] ? (
                <div className="sm:col-span-12">
                  <Label className="text-xs">Line Note</Label>
                  <Input placeholder="Optional note for this line" value={item.note || ""} onChange={(e) => setItems(prev => prev.map(it => it.id === item.id ? { ...it, note: e.target.value } : it))} />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          {selectedCustomer ? (
            <div className="text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Available Points</span>
              <span className="font-mono font-semibold">{selectedCustomer.loyaltyPoints}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                data-testid="input-discount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax (%)</Label>
              <Input
                id="tax"
                type="number"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                data-testid="input-tax"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redeem">Redeem Points</Label>
              <Input
                id="redeem"
                type="number"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Number(e.target.value))}
                data-testid="input-redeem"
              />
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-mono text-destructive">-${discountAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-mono">+${taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Redeemed</span>
            <span className="font-mono">-${usablePoints.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-mono font-bold">${total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Earned Points</span>
            <span className="font-mono font-semibold">{earnedPoints}</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input placeholder="Optional note shown on print" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <Separator />

        {/* Payments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Payments</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setPayments([...payments, { method: (selectedCustomer as any)?.preferredPayment || "Cash", amount: 0 }])}>Add Payment</Button>
          </div>
          {payments.map((p, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="w-40 space-y-1">
                <Label className="text-xs">Method</Label>
                <Select value={p.method} onValueChange={(v) => setPayments(prev => prev.map((pp, i) => i === idx ? { ...pp, method: v } : pp))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Cash</div></SelectItem>
                    <SelectItem value="Bank"><div className="flex items-center gap-2"><Landmark className="h-4 w-4" /> Bank</div></SelectItem>
                    <SelectItem value="Card"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Card</div></SelectItem>
                    <SelectItem value="Mobile"><div className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile</div></SelectItem>
                    <SelectItem value="Points"><div className="flex items-center gap-2"><Coins className="h-4 w-4" /> Points</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40 space-y-1">
                <Label className="text-xs">Amount</Label>
                <Input type="number" value={p.amount}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setPayments(prev => prev.map((pp, i) => {
                      if (i !== idx) return pp;
                      // Clamp points to available
                      if (pp.method === "Points") {
                        const available = selectedCustomer?.loyaltyPoints || 0;
                        const maxUse = Math.min(Math.floor(taxBase + taxAmount), available);
                        const clamped = Math.max(0, Math.min(val, maxUse));
                        // keep redeemPoints in sync
                        setRedeemPoints(clamped);
                        return { ...pp, amount: clamped };
                      }
                      return { ...pp, amount: val };
                    }));
                  }}
                />
              </div>
              {p.method !== "Cash" && p.method !== "Points" ? (
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Reference</Label>
                  <Input placeholder="Txn ID / Gateway Ref" value={p.ref || ""} onChange={(e) => setPayments(prev => prev.map((pp, i) => i === idx ? { ...pp, ref: e.target.value } : pp))} />
                </div>
              ) : null}
              <Button type="button" variant="ghost" size="icon" onClick={() => setPayments(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Paid</span><span className="font-mono">${totalPayments.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Balance</span><span className="font-mono">${balance.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Change</span><span className="font-mono">${change.toFixed(2)}</span></div>
          </div>
        </div>

        <Separator />

        {/* Custom fields for template */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Custom Fields</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setCustomFields([...customFields, { label: "", value: "" }])}>Add Field</Button>
          </div>
          <div className="space-y-2">
            {customFields.map((cf, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input placeholder="Label" value={cf.label} onChange={(e) => setCustomFields(prev => prev.map((f, i) => i === idx ? { ...f, label: e.target.value } : f))} className="w-48" />
                <Input placeholder="Value" value={cf.value} onChange={(e) => setCustomFields(prev => prev.map((f, i) => i === idx ? { ...f, value: e.target.value } : f))} />
                <Button type="button" variant="ghost" size="icon" onClick={() => setCustomFields(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          {customFields.length > 0 && (
            <div className="text-xs text-muted-foreground">Custom fields will be shown on print/export template.</div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" variant="outline" onClick={() => { statusRef.current = "Draft"; saveMutation.mutate(); }} data-testid="button-save-draft">
            Save as Draft
          </Button>
          <Button className="flex-1" onClick={() => { statusRef.current = "Completed"; saveMutation.mutate(); }} data-testid="button-complete-invoice" disabled={items.filter(i=>i.productId&&i.qty>0).length===0}>
            Complete Sale
          </Button>
          <Button variant="outline" data-testid="button-print-invoice" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
    <div className="hidden print:block text-xs text-black">
      <div className="max-w-2xl mx-auto p-4 border border-black">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            {storeInfo.logo ? (
              <img src={storeInfo.logo} alt="Logo" className="h-10 w-10 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : null}
            <div>
              <div className="text-base font-bold">{storeInfo.name || "Store"}</div>
              {storeInfo.address ? <div>{storeInfo.address}</div> : null}
              {(storeInfo.phone || storeInfo.email) ? (
                <div>
                  {storeInfo.phone}{storeInfo.phone && storeInfo.email ? " · " : ""}{storeInfo.email}
                </div>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">Cash Memo</div>
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div>No: {printInvoiceNumber}</div>
          </div>
        </div>
        <div className="my-2 border-t border-dashed border-black" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div><span className="font-semibold">Customer:</span> {selectedCustomer?.name || "Walk-in"}</div>
            <div><span className="font-semibold">ID:</span> {selectedCustomer?.id || "-"}</div>
            <div><span className="font-semibold">Phone:</span> {selectedCustomer?.phone || "-"}</div>
            <div><span className="font-semibold">Address:</span> {(selectedCustomer as any)?.address || "-"}</div>
          </div>
          <div className="text-right">
            <div><span className="font-semibold">Salesperson:</span> {user?.fullName || "System"}</div>
          </div>
        </div>
        <div className="my-2 border-t border-dashed border-black" />
        <div>
          <div className="grid grid-cols-12 font-semibold">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Points</div>
            <div className="col-span-2 text-center">Unit Type</div>
            <div className="col-span-1 text-right">Price</div>
            <div className="col-span-1 text-right">Amount</div>
          </div>
          <div className="border-t border-black" />
          {items.filter(i=>i.productId && i.qty>0).map((it, idx) => {
            const p = productById[it.productId];
            const pts = (p as any)?.points != null ? Number((p as any)?.points) * it.qty : 0;
            const typ = (p as any)?.type || (p as any)?.category || "-";
            const price = Number(it.price) || 0;
            const amount = price * it.qty;
            return (
              <div key={idx} className="grid grid-cols-12">
                <div className="col-span-6">{p?.name || it.productId} x{it.qty}</div>
                <div className="col-span-2 text-center">{pts}</div>
                <div className="col-span-2 text-center">{typ}</div>
                <div className="col-span-1 text-right">{price.toFixed(2)}</div>
                <div className="col-span-1 text-right">{amount.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
        <div className="my-2 border-t border-dashed border-black" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div>
              <span className="font-semibold">Note:</span>
              {note ? <span> {note}</span> : null}
            </div>
            {!note ? (
              <div className="mt-1 h-12 border border-dashed border-black" />
            ) : null}
            {customFields?.length ? (
              <div className="mt-1 space-y-0.5">
                {customFields.map((f, i) => (
                  <div key={i}><span className="font-semibold">{f.label}:</span> {f.value}</div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="text-right space-y-0.5">
            <div><span className="font-semibold">Subtotal:</span> {subtotal.toFixed(2)}</div>
            <div><span className="font-semibold">Discount:</span> -{discountAmount.toFixed(2)}</div>
            <div><span className="font-semibold">Tax:</span> +{taxAmount.toFixed(2)}</div>
            <div><span className="font-semibold">Redeemed:</span> -{usablePoints.toFixed(2)}</div>
            <div className="text-base font-bold"><span>Total:</span> {total.toFixed(2)}</div>
          </div>
        </div>
        <div className="my-2 border-t border-dashed border-black" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array.from(new Set(payments.map(p=>p.method))).map((m, i) => (
              <div key={i} className="flex items-center gap-1">
                {m === "Cash" ? <DollarSign className="h-4 w-4" /> : null}
                {m === "Bank" ? <Landmark className="h-4 w-4" /> : null}
                {m === "Card" ? <CreditCard className="h-4 w-4" /> : null}
                {m === "Mobile" ? <Smartphone className="h-4 w-4" /> : null}
                {m === "Points" ? <Coins className="h-4 w-4" /> : null}
                <span>{m}</span>
              </div>
            ))}
          </div>
          <div className="text-right">
            <div className="font-semibold">Thank you for your purchase!</div>
            <div className="text-[10px]">Please come again</div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
