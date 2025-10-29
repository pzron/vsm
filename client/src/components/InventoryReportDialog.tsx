import { useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import type { InventoryAdjustment, Product } from "@shared/schema";
import { startOfDay, startOfWeek, subDays, formatDistanceToNow } from "date-fns";

export function InventoryReportDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("week");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "in" | "low" | "out">("all");
  const [useRange, setUseRange] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [demo, setDemo] = useState(false);

  const { data: adjustmentsReal = [] } = useQuery<InventoryAdjustment[]>({ queryKey: ["/api/inventory/adjustments"], refetchInterval: 5000 });
  const { data: productsReal = [] } = useQuery<Product[]>({ queryKey: ["/api/products"], refetchInterval: 5000 });

  // Demo data (client-side only)
  const demoProducts: Product[] = [
    { id: "demo-1", name: "Demo Shampoo", sku: "DMO-SH-001", category: "Cosmetics", currentStock: 120, minStock: 30, costPrice: "2.50", retailPrice: "4.99", createdAt: new Date() as any, updatedAt: new Date() as any } as any,
    { id: "demo-2", name: "Demo Rice 5kg", sku: "DMO-RC-5", category: "Grocery", currentStock: 18, minStock: 25, costPrice: "6.00", retailPrice: "8.50", createdAt: new Date() as any, updatedAt: new Date() as any } as any,
    { id: "demo-3", name: "Demo Battery AA", sku: "DMO-AA-2", category: "Electronics", currentStock: 0, minStock: 10, costPrice: "0.40", retailPrice: "0.99", createdAt: new Date() as any, updatedAt: new Date() as any } as any,
  ];
  const now = new Date();
  const demoAdjustments: InventoryAdjustment[] = [
    { id: "adj-1", productId: "demo-1", productName: "Demo Shampoo", type: "Stock In" as any, quantity: 50, previousStock: 70, newStock: 120, reason: "Supplier delivery", adjustedBy: "demo", adjustedByName: "Demo", createdAt: new Date(now.getTime() - 86400000) as any } as any,
    { id: "adj-2", productId: "demo-2", productName: "Demo Rice 5kg", type: "Stock Out" as any, quantity: 12, previousStock: 30, newStock: 18, reason: "Sales", adjustedBy: "demo", adjustedByName: "Demo", createdAt: new Date(now.getTime() - 2*86400000) as any } as any,
    { id: "adj-3", productId: "demo-3", productName: "Demo Battery AA", type: "Stock Out" as any, quantity: 10, previousStock: 10, newStock: 0, reason: "Sales", adjustedBy: "demo", adjustedByName: "Demo", createdAt: new Date(now.getTime() - 3*86400000) as any } as any,
    { id: "adj-4", productId: "demo-2", productName: "Demo Rice 5kg", type: "Stock In" as any, quantity: 20, previousStock: 10, newStock: 30, reason: "Return from customer", adjustedBy: "demo", adjustedByName: "Demo", createdAt: new Date(now.getTime() - 6*86400000) as any } as any,
  ];

  const products = useMemo(() => demo ? [...productsReal, ...demoProducts] : productsReal, [demo, productsReal]);
  const adjustments = useMemo(() => demo ? [...adjustmentsReal, ...demoAdjustments] : adjustmentsReal, [demo, adjustmentsReal]);

  const byProduct = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return Array.from(set).sort();
  }, [products]);

  const filterByTimeframe = (list: InventoryAdjustment[]) => {
    if (useRange && (dateFrom || dateTo)) {
      const from = dateFrom ? new Date(dateFrom) : new Date(0);
      const to = dateTo ? new Date(dateTo) : new Date();
      return list.filter(a => {
        const d = new Date(a.createdAt as any);
        return d >= from && d <= to;
      });
    }
    if (timeframe === "all") return list;
    const now = new Date();
    if (timeframe === "week") {
      const since = startOfWeek(now, { weekStartsOn: 1 });
      return list.filter(a => new Date(a.createdAt as any) >= since);
    }
    // month -> last 30 days
    const since = startOfDay(subDays(now, 29));
    return list.filter(a => new Date(a.createdAt as any) >= since);
  };

  const section = (kind: "Stock In" | "Stock Out" | "Returns") => {
    let list = adjustments.slice();
    if (kind === "Returns") {
      list = list.filter(a => String(a.reason || "").toLowerCase().includes("return"));
    } else {
      list = list.filter(a => (a.type as any) === kind);
    }
    list = filterByTimeframe(list);

    // Aggregate per product with extra info
    const extractRef = (reason?: string) => {
      const r = String(reason || "");
      // Try common patterns: Invoice: XYZ, invoice#XYZ, INV-XYZ
      const m = r.match(/(invoice\s*[:#]\s*([A-Za-z0-9-]+)|\bINV-([A-Za-z0-9-]+)\b)/i);
      if (!m) return r || "";
      return (m[2] || m[3] || r).trim();
    };
    type Row = { id: string; name: string; sku: string; category: string; qty: number; actions: number; status: string; current: number; min: number; lastAdjusted?: string; lastAdjustedBy?: string; reference?: string };
    const map = new Map<string, Row>();
    for (const a of list) {
      const key = a.productId as string;
      const p = byProduct.get(key);
      const status = p
        ? (p.currentStock === 0 ? "Out of Stock" : p.currentStock < p.minStock ? "Low Stock" : "In Stock")
        : "Unknown";
      const row = map.get(key) || { id: key, name: a.productName, sku: p?.sku || "", category: p?.category || "", qty: 0, actions: 0, status, current: p?.currentStock || 0, min: p?.minStock || 0, lastAdjusted: undefined, lastAdjustedBy: undefined, reference: undefined };
      row.qty += a.quantity || 0;
      row.actions += 1;
      // Track last adjusted by latest createdAt
      const cur = row.lastAdjusted ? new Date(row.lastAdjusted) : new Date(0);
      const cand = new Date(a.createdAt as any);
      if (cand > cur) {
        row.lastAdjusted = cand.toISOString();
        row.lastAdjustedBy = a.adjustedByName as any;
        if (kind === "Stock Out") row.reference = extractRef(a.reason as any);
      }
      map.set(key, row);
    }
    let rows = Array.from(map.values());
    // Apply filters
    if (category !== "all") rows = rows.filter(r => r.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    if (status !== "all") {
      rows = rows.filter(r => (status === "in" && r.status === "In Stock") || (status === "low" && r.status === "Low Stock") || (status === "out" && r.status === "Out of Stock"));
    }
    rows.sort((a, b) => b.qty - a.qty);
    return rows;
  };

  const stockInRows = section("Stock In");
  const stockOutRows = section("Stock Out");
  const returnRows = section("Returns");

  const ExportButton = ({ rows, filename }: { rows: { name: string; qty: number; actions: number; category?: string; status?: string; sku?: string; current?: number; min?: number; lastAdjusted?: string; lastAdjustedBy?: string; reference?: string }[]; filename: string }) => (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        try {
          const header = "Product,SKU,Category,Status,Current,Min,Last Adjusted,Person,Reference,Quantity (pcs),Entries";
          const csv = [header].concat(rows.map(r => `${JSON.stringify(r.name)},${JSON.stringify(r.sku||"")},${JSON.stringify(r.category || "")},${JSON.stringify(r.status || "")},${r.current ?? ""},${r.min ?? ""},${JSON.stringify(r.lastAdjusted ? new Date(r.lastAdjusted).toLocaleString() : "")},${JSON.stringify(r.lastAdjustedBy||"")},${JSON.stringify(r.reference||"")},${r.qty},${r.actions}`)).join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
        } catch {}
      }}
    >Export CSV</Button>
  );

  const SectionTable = ({ rows }: { rows: { name: string; qty: number; actions: number; category?: string; status?: string; sku?: string; current?: number; min?: number; lastAdjusted?: string; lastAdjustedBy?: string; reference?: string }[] }) => {
    const totals = rows.reduce((acc, r) => { acc.qty += r.qty; acc.entries += r.actions; return acc; }, { qty: 0, entries: 0 });
    return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{rows.length} products • {totals.qty} pcs • {totals.entries} entries</div>
      </div>
      <div className="rounded border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">Min</TableHead>
              <TableHead>Last Adjusted</TableHead>
              <TableHead>Person</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Entries</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.sku || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.category || "—"}</TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded border">
                    {r.status || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">{r.current ?? ""}</TableCell>
                <TableCell className="text-right font-mono">{r.min ?? ""}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.lastAdjusted ? new Date(r.lastAdjusted).toLocaleString() : "—"}</TableCell>
                <TableCell className="text-sm">{r.lastAdjustedBy || "—"}</TableCell>
                <TableCell className="text-sm">{r.reference || "—"}</TableCell>
                <TableCell className="text-right font-mono">{r.qty}</TableCell>
                <TableCell className="text-right font-mono">{r.actions}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No data.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  ); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Inventory Reports</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">Stock In / Stock Out / Returns</div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input placeholder="Search name/category" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Custom</label>
              <input type="checkbox" checked={useRange} onChange={(e) => setUseRange(e.target.checked)} />
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" disabled={!useRange} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" disabled={!useRange} />
            </div>
            <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
            <Button size="sm" onClick={() => setDemo(d => !d)}>{demo ? "Disable" : "Load"} Demo Data</Button>
          </div>
        </div>
        <Tabs defaultValue="in">
          <TabsList>
            <TabsTrigger value="in">Stock In</TabsTrigger>
            <TabsTrigger value="out">Stock Out</TabsTrigger>
            <TabsTrigger value="return">Returns</TabsTrigger>
          </TabsList>
          <TabsContent value="in">
            <div className="flex justify-end mb-2">
              <ExportButton rows={stockInRows} filename={`inventory_stock_in_${timeframe}.csv`} />
            </div>
            <SectionTable rows={stockInRows} />
          </TabsContent>
          <TabsContent value="out">
            <div className="flex justify-end mb-2">
              <ExportButton rows={stockOutRows} filename={`inventory_stock_out_${timeframe}.csv`} />
            </div>
            <SectionTable rows={stockOutRows} />
          </TabsContent>
          <TabsContent value="return">
            <div className="flex justify-end mb-2">
              <ExportButton rows={returnRows} filename={`inventory_returns_${timeframe}.csv`} />
            </div>
            <SectionTable rows={returnRows} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
