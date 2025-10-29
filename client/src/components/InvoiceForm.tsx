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
import { Trash2, Plus, ScanLine, Search, RotateCcw, CreditCard, Smartphone, DollarSign, Landmark, Coins, ArrowUp, ArrowDown, StickyNote, Barcode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Customer, Invoice } from "@shared/schema";
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
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"], refetchInterval: 5000 });

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
  const [tax, setTax] = useState(0);
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
  const [newCustomer, setNewCustomer] = useState<{ name: string; username: string; type: string; phone?: string; address?: string }>({ name: "", username: "", type: "Retail" });
  const [newCustomerError, setNewCustomerError] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [thana, setThana] = useState<string>("");
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

  // Build last purchase price map per product for the selected customer
  const lastPriceByProduct = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedCustomerId) return map;
    const custInvoices = (invoices as Invoice[]).filter(inv => (inv.customerId as any) === selectedCustomerId);
    // Sort by createdAt desc
    custInvoices.sort((a,b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    for (const inv of custInvoices) {
      const items = (inv.items as any[]) || [];
      for (const it of items) {
        const pid = String(it.productId || "");
        if (!pid || map.has(pid)) continue;
        const price = parseFloat(String(it.price || it.unitPrice || 0));
        if (!isNaN(price) && price > 0) map.set(pid, price);
      }
    }
    return map;
  }, [invoices, selectedCustomerId]);

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

  // Minimal BD districts and thanas; extend as needed
  const bdDistricts = [
    "Dhaka","Chattogram","Rajshahi","Khulna","Sylhet","Barishal","Rangpur","Mymensingh"
  ];
  const bdThanas: Record<string, string[]> = {
    Dhaka: ["Dhanmondi","Gulshan","Uttara","Mirpur","Tejgaon"],
    Chattogram: ["Kotwali","Pahartali","Panchlaish","Halishahar"],
    Rajshahi: ["Boalia","Rajpara","Motihar"],
    Khulna: ["Khalishpur","Sonadanga","Khan Jahan Ali"],
    Sylhet: ["Kotwali","Jalalabad","Shahporan"],
    Barishal: ["Kotwali","Airport","Banaripara"],
    Rangpur: ["Kotwali","Mahiganj","Haragach"],
    Mymensingh: ["Kotwali","Trishal","Gafargaon"],
  };

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode || "").toLowerCase().includes(q)
    );
  }, [products, productFilter]);

  // Auto-select customer when phone or username matches exactly
  useEffect(() => {
    if (selectedCustomerId) return; // already selected
    const phone = (newCustomer.phone || "").trim();
    const uname = (newCustomer.username || "").trim();
    if (!phone && !uname) return;
    const match = customers.find(c => (c.phone && c.phone === phone) || ((c as any).username && (c as any).username === uname));
    if (match) setSelectedCustomerId(match.id);
  }, [newCustomer.phone, newCustomer.username, customers, selectedCustomerId]);

  // When a customer is selected, prefill inline form fields (for visibility)
  useEffect(() => {
    if (!selectedCustomer) return;
    setNewCustomer(prev => ({
      ...prev,
      name: selectedCustomer.name || prev.name,
      username: ((selectedCustomer as any).username || prev.username || ""),
      type: (selectedCustomer.type as any) || prev.type || "Retail",
      phone: selectedCustomer.phone || prev.phone,
      address: ((selectedCustomer as any).address || prev.address || ""),
    }));
    setDistrict(((selectedCustomer as any).district || district || ""));
    setThana(((selectedCustomer as any).thana || thana || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

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
      const last = lastPriceByProduct.get(it.productId);
      return { ...it, price: last != null ? last : priceForCustomer(p) };
    }));
    // Auto-apply customer-type default discount
    const t = (selectedCustomer?.type || "Retail").toLowerCase();
    const defaults: Record<string, number> = { retail: 0, wholesale: 5, vip: 10, member: 2, depo: 0, dealer: 0 };
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
        const last = lastPriceByProduct.get(pid);
        rows.push({ id: String(rowId++), productId: pid, qty, price: last != null ? last : priceForCustomer(p) });
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
      // Auto-create customer if none selected and new customer name provided
      let customerIdToUse = selectedCustomerId || "";
      if (!customerIdToUse && newCustomer.name.trim()) {
        if (!newCustomer.username.trim() || !newCustomer.type.trim()) {
          setNewCustomerError("Name, username, and type are required for new customer.");
          throw new Error("Missing required new customer fields");
        }
        setNewCustomerError("");
        const composedAddress = [thana, district, (newCustomer.address||"").trim()].filter(Boolean).join(", ");
        const created = await apiRequest("POST", "/api/customers", { name: newCustomer.name.trim(), username: newCustomer.username.trim(), type: newCustomer.type.trim(), phone: (newCustomer.phone||"").trim() || undefined, address: composedAddress || undefined, district: district || undefined, thana: thana || undefined });
        customerIdToUse = (created as any)?.id || (created as any)?._id || customerIdToUse;
      }
      const availablePoints = selectedCustomer?.loyaltyPoints || 0;
      const pointsPaymentAmount = payments.find(p => p.method === "Points")?.amount || 0;
      const redeem = Math.max(0, Math.min(Math.floor(taxBase + taxAmount), Math.min(pointsPaymentAmount, availablePoints)));
      const finalTotal = Math.max(0, (taxBase + taxAmount) - redeem);
      const payload = {
        invoiceNumber: `INV-${Date.now()}`,
        customerId: customerIdToUse || undefined,
        customerName: (customerIdToUse ? (selectedCustomer?.name || newCustomer.name) : undefined),
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
      setTax(0);
      setRedeemPoints(0);
      setPayments([{ method: (selectedCustomer as any)?.preferredPayment || "Cash", amount: 0 }]);
      setNote("");
      setNewCustomer({ name: "", username: "", type: "Retail" });
      setNewCustomerError("");
      setDistrict("");
      setThana("");
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
              {/* New Customer removed as requested */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto use points</span>
                <Switch checked={autoUsePoints} onCheckedChange={setAutoUsePoints} />
              </div>
            </div>
            {/* Removed customer ID paste/Use ID */}
          </div>
          <div className="space-y-2">
            <Label htmlFor="salesperson">Salesperson</Label>
            <Input id="salesperson" value={user?.fullName || "System"} readOnly />
          </div>
        </div>

        {/* Inline New Customer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input placeholder="Enter phone" value={newCustomer.phone || ""} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Username</Label>
            <Input placeholder="Enter username" value={newCustomer.username} onChange={(e) => setNewCustomer(prev => ({ ...prev, username: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">New Customer Name</Label>
            <Input placeholder="Enter name" value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">District</Label>
            <Select value={district} onValueChange={(v) => { setDistrict(v); setThana(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {bdDistricts.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Thana</Label>
            <Select value={thana} onValueChange={setThana} disabled={!district}>
              <SelectTrigger>
                <SelectValue placeholder={district ? "Select thana" : "Select district first"} />
              </SelectTrigger>
              <SelectContent>
                {(bdThanas[district] || []).map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Address</Label>
            <Input placeholder="Optional" value={newCustomer.address || ""} onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={newCustomer.type} onValueChange={(v) => setNewCustomer(prev => ({ ...prev, type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Depo">Depo</SelectItem>
                <SelectItem value="Dealer">Dealer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newCustomerError && (
            <div className="md:col-span-3 text-[12px] text-destructive">{newCustomerError}</div>
          )}
        </div>

        {/* Quick add / Barcode / Actions removed as requested */}

        <Separator />

        {/* Items (essential) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Items</Label>
            <Button size="sm" variant="outline" onClick={addItem} data-testid="button-add-item" className="border-0 bg-gradient-to-r from-emerald-500 via-purple-500 to-pink-500 text-white hover:brightness-110 shadow-md hover:shadow-lg">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          {items.map((item, index) => {
            const p = productById[item.productId] as any;
            const img = p?.image || p?.photo || "";
            const ptsPerUnit = p?.points ? Number(p.points) : 0;
            const linePoints = ptsPerUnit * (item.qty || 0);
            const lineTotal = effectiveUnit(item) * (item.qty || 0);
            return (
              <div key={item.id} className="rounded-xl border bg-gradient-to-r from-emerald-50 via-purple-50 to-pink-50 p-3 shadow-sm hover:shadow-md transition-shadow" data-testid={`invoice-item-${index}`}>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                  <div className="h-12 w-12 rounded-md bg-white border flex items-center justify-center overflow-hidden">
                    {img ? (<img src={img} alt={p?.name||""} className="h-full w-full object-cover" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />) : (
                      <div className="text-xs text-muted-foreground">{p?.name ? p.name.slice(0,2).toUpperCase() : "PI"}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs">Product</Label>
                    <Select value={item.productId} onValueChange={(pid) => {
                      const sel = products.find(pp => pp.id === pid)!;
                      const last = lastPriceByProduct.get(pid);
                      setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, productId: pid, price: (last != null ? last : priceForCustomer(sel)), qty: clampQty(pid, it.qty || 1) } : it));
                    }}>
                      <SelectTrigger data-testid={`input-product-${index}`}>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 sticky top-0 bg-popover z-10">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-7 h-8" placeholder="Search name, SKU, or barcode" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} />
                          </div>
                        </div>
                        {filteredProducts.map(fp => (
                          <SelectItem key={fp.id} value={fp.id}>{fp.name} ({fp.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" value={item.qty} onChange={(e) => setItems(prev => prev.map(it => it.id === item.id ? { ...it, qty: clampQty(it.productId, Number(e.target.value)) } : it))} data-testid={`input-qty-${index}`} className="backdrop-blur bg-white/70" />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Price</Label>
                    <Input type="number" value={item.price} onChange={(e) => setItems(prev => prev.map(it => it.id === item.id ? { ...it, price: Number(e.target.value) } : it))} data-testid={`input-price-${index}`} className="backdrop-blur bg-white/70" />
                  </div>
                  {/* Inline colorful chips */}
                  <div className="hidden md:flex items-center gap-2 ml-auto">
                    <div className="rounded-md bg-white/70 border px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
                      <span className="text-muted-foreground">Pt/U</span>
                      <span className="font-mono font-semibold">{ptsPerUnit}</span>
                    </div>
                    <div className="rounded-md bg-emerald-100/80 border px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
                      <span className="text-emerald-700">TP</span>
                      <span className="font-mono font-semibold text-emerald-800">{linePoints}</span>
                    </div>
                    <div className="rounded-md bg-purple-100/80 border px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
                      <span className="text-purple-700">Unit</span>
                      <span className="font-mono font-semibold text-purple-800">{effectiveUnit(item).toFixed(2)}</span>
                    </div>
                    <div className="rounded-md bg-pink-100/80 border px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
                      <span className="text-pink-700">Total</span>
                      <span className="font-mono font-semibold text-pink-800">{lineTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="w-10 flex items-end justify-end">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} data-testid={`button-remove-${index}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {/* On small screens, show chips in a second row */}
                <div className="mt-2 flex md:hidden flex-wrap items-center gap-2">
                  <div className="rounded-md bg-white/70 border px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
                    <span className="text-muted-foreground">Point/Unit</span>
                    <span className="font-mono font-semibold">{ptsPerUnit}</span>
                  </div>
                  <div className="rounded-md bg-emerald-100/80 border px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
                    <span className="text-emerald-700">Total Point</span>
                    <span className="font-mono font-semibold text-emerald-800">{linePoints}</span>
                  </div>
                  <div className="rounded-md bg-purple-100/80 border px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
                    <span className="text-purple-700">Unit</span>
                    <span className="font-mono font-semibold text-purple-800">{effectiveUnit(item).toFixed(2)}</span>
                  </div>
                  <div className="rounded-md bg-pink-100/80 border px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
                    <span className="text-pink-700">Total</span>
                    <span className="font-mono font-semibold text-pink-800">{lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-3">
          {selectedCustomer ? (
            <div className="text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Available Points</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-mono font-semibold">{selectedCustomer.loyaltyPoints}</span>
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
              <Input id="tax" type="number" value={0} disabled readOnly data-testid="input-tax" />
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
            <span className="font-mono">+$0.00</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-sky-700">Redeemed</span>
            <span className="font-mono text-sky-800">-${usablePoints.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-mono font-bold">${total.toFixed(2)}</span>
          </div>

          {/* Estimated Earned Points removed as requested */}
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
            <div key={idx} className="flex flex-wrap gap-2 items-end">
              <div className="w-48 space-y-1">
                <Label className="text-xs">Method</Label>
                <Select value={p.method} onValueChange={(v) => setPayments(prev => prev.map((pp, i) => i === idx ? { ...pp, method: v } : pp))}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {p.method === "Cash" && <DollarSign className="h-4 w-4" />}
                        {p.method === "Bank" && <Landmark className="h-4 w-4" />}
                        {p.method === "Card" && <CreditCard className="h-4 w-4" />}
                        {p.method === "Mobile" && <Smartphone className="h-4 w-4" />}
                        {p.method === "Points" && <Coins className="h-4 w-4" />}
                        <span>{p.method || "Select method"}</span>
                      </div>
                    </SelectValue>
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
                      if (pp.method === "Points") {
                        const available = selectedCustomer?.loyaltyPoints || 0;
                        const maxUse = Math.min(Math.floor(taxBase + taxAmount), available);
                        return { ...pp, amount: Math.min(val, maxUse) };
                      }
                      return { ...pp, amount: val };
                    }));
                  }}
                />
              </div>
              <Button size="icon" variant="ghost" onClick={() => setPayments(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
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
          <Button className="flex-1" onClick={() => { statusRef.current = "Completed"; saveMutation.mutate(); }} data-testid="button-complete-invoice">
            Complete Sale
          </Button>
          <Button variant="outline" data-testid="button-print-invoice" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
    <div className="hidden print:block text-xs text-black">
      <div className="max-w-2xl mx-auto p-6 border border-black">
        {/* Header (Company info + Invoice number with barcode) */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {storeInfo.logo ? (
              <img src={storeInfo.logo} alt="Logo" className="h-12 w-12 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : null}
            <div>
              <div className="text-lg font-extrabold">{storeInfo.name || "Store"}</div>
              {storeInfo.address ? <div className="opacity-80">{storeInfo.address}</div> : null}
              {(storeInfo.phone || storeInfo.email) ? (
                <div className="opacity-80">{storeInfo.phone}{storeInfo.phone && storeInfo.email ? " · " : ""}{storeInfo.email}</div>
              ) : null}
              {/* Fixed company contact lines as requested */}
              <div className="opacity-90">Muradpur, Panchlaish, Chattogram, Bangladesh</div>
              <div className="opacity-90">support@myvertexbd.com · 01813142677</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-extrabold text-sky-700">INVOICE</div>
            <div className="flex items-center justify-end gap-1 opacity-90"><Barcode className="h-3 w-3" /> <span className="font-mono">{printInvoiceNumber}</span></div>
            <div className="opacity-80">Date: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        {/* Buyer info */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="uppercase text-[10px] opacity-70">Invoice To</div>
            <div className="text-base font-semibold">{selectedCustomer?.name || "Walk-in"}</div>
            {(selectedCustomer?.phone || (selectedCustomer as any)?.email) ? (
              <div className="opacity-80">{selectedCustomer?.phone}{selectedCustomer?.phone && (selectedCustomer as any)?.email ? " · " : ""}{(selectedCustomer as any)?.email || ""}</div>
            ) : null}
            <div className="opacity-80">{(selectedCustomer as any)?.address || "-"}</div>
          </div>
          <div className="text-right">
            <div><span className="font-semibold">Salesperson:</span> {user?.fullName || "System"}</div>
          </div>
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        {/* Items table (colorful headers and totals) */}
        <div>
          <div className="grid grid-cols-12 font-semibold text-sky-800">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-center">Point</div>
            <div className="col-span-1 text-right">Price</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-1 text-center">Total Pt</div>
            <div className="col-span-1 text-right">Total Price</div>
          </div>
          <div className="border-t border-black" />
          {items.filter(i=>i.productId && i.qty>0).map((it, idx) => {
            const p = productById[it.productId];
            const ptUnit = (p as any)?.points != null ? Number((p as any)?.points) : 0;
            const price = Number(it.price) || 0;
            const totPt = ptUnit * (it.qty || 0);
            const totPrice = price * (it.qty || 0);
            return (
              <div key={idx} className="grid grid-cols-12">
                <div className="col-span-1">{idx+1}</div>
                <div className="col-span-5">
                  <div className="font-medium">{p?.name || it.productId}</div>
                  {(p as any)?.desc ? <div className="opacity-70 text-[10px]">{(p as any)?.desc}</div> : null}
                </div>
                <div className="col-span-2 text-center text-emerald-700 font-semibold">{ptUnit}</div>
                <div className="col-span-1 text-right">৳ {price.toFixed(2)}</div>
                <div className="col-span-1 text-center">{it.qty}</div>
                <div className="col-span-1 text-center text-emerald-800 font-semibold">{totPt}</div>
                <div className="col-span-1 text-right text-pink-800 font-semibold">৳ {totPrice.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        {/* Totals */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-base font-semibold">Thank you!</div>
          </div>
          <div className="text-right space-y-0.5">
            <div><span className="font-semibold">SUBTOTAL:</span> ৳ {subtotal.toFixed(2)}</div>
            <div><span className="font-semibold">DISCOUNT:</span> - ৳ {discountAmount.toFixed(2)}</div>
            <div><span className="font-semibold">TAX:</span> + ৳ {taxAmount.toFixed(2)}</div>
            <div><span className="font-semibold">REDEEMED:</span> - ৳ {usablePoints.toFixed(2)}</div>
            <div className="text-base font-extrabold text-sky-700"><span>GRAND TOTAL:</span> ৳ {total.toFixed(2)}</div>
          </div>
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        {/* Footer note (remove extra icons, keep clean) */}
        <div className="text-right">
          <div className="font-semibold">Invoice was created on a computer and is valid without signature and seal.</div>
        </div>
      </div>
    </div>
    </>
  );
}
