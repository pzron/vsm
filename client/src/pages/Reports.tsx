import { ReportsFilters, type ReportFilters } from "@/components/ReportsFilters";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { RevenueChart } from "@/components/RevenueChart";
import { ReportsSummary } from "@/components/ReportsSummary";
import { PaymentBreakdownChart } from "@/components/PaymentBreakdownChart";
import { TopProductsCard } from "@/components/TopProductsCard";
import { TopCustomersCard } from "@/components/TopCustomersCard";
import { InventoryReports } from "@/components/InventoryReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Invoice } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { InvoicePreviewDialog } from "@/components/InvoicePreviewDialog";

export default function Reports() {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"], refetchInterval: 5000 });
  const { user } = useAuth();
  const [notes, setNotes] = useState<string>("");
  const [filters, setFilters] = useState<ReportFilters | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);
  const [invSearch, setInvSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();
  useEffect(() => {
    const n = localStorage.getItem("reports_notes") || "";
    setNotes(n);
  }, []);
  useEffect(() => {
    localStorage.setItem("reports_notes", notes);
  }, [notes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate custom reports with advanced filters and export options</p>
      </div>

      <ReportsSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ReportsFilters onGenerate={(f) => setFilters(f)} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <TodayCashToolbar invoices={invoices} onToggleAll={() => setShowAll((v) => !v)} showAll={showAll} onExport={() => exportCSV(invoices, filters)} />
          {showAll && (
            <AllInvoicesTable
              invoices={invoices}
              search={invSearch}
              onSearch={setInvSearch}
              page={page}
              onPageChange={setPage}
              pageSize={pageSize}
              onEdit={async (inv: Invoice) => {
                const currentC = String(inv.customerName || "");
                const currentS = String(inv.staffName || "");
                const newC = prompt("Edit Customer Name", currentC);
                if (newC === null) return;
                const newS = prompt("Edit Staff Name", currentS);
                if (newS === null) return;
                await fetch(`/api/invoices/${inv.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: newC, staffName: newS }) });
                await queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
              }}
              onDelete={async (id: string) => {
                if (!confirm("Delete this invoice? This cannot be undone.")) return;
                await fetch(`/api/invoices/${id}`, { method: "DELETE" });
                await queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
              }}
            />
          )}
          {user?.role === "Admin" && (
            <>
              <RevenueChart filters={filters} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CategoryPieChart title="Revenue by Category" filters={filters} />
                <PaymentBreakdownChart filters={filters} />
              </div>
            </>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopProductsCard />
            <TopCustomersCard />
          </div>
          <InventoryReports />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {invoices.slice(0, 8).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-medium">{(inv.invoiceNumber as any) || inv.id}</div>
                        <div className="text-muted-foreground">{new Date(inv.createdAt as any).toLocaleString()}</div>
                      </div>
                      <div className="font-mono">${parseFloat(inv.total as string).toFixed(2)}</div>
                    </div>
                  ))}
                  {invoices.length === 0 && <div className="text-muted-foreground">No recent invoices.</div>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[160px] rounded border bg-background p-2 text-sm"
                  placeholder="Write daily notes, observations, and follow-ups..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function TodayCashToolbar({ invoices, onToggleAll, showAll, onExport }: { invoices: Invoice[]; onToggleAll: () => void; showAll: boolean; onExport: () => void }) {
  const [open, setOpen] = useState(false);
  const formatYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState<string>(formatYMD(new Date()));
  const [deposit, setDeposit] = useState<number>(0);
  const storageKey = useMemo(() => `today_cash_deposit_${selectedDate}`, [selectedDate]);
  // load persisted deposit for selected date
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const obj = JSON.parse(raw) as { deposit?: number };
        setDeposit(Number(obj.deposit || 0));
      }
    } catch {}
  }, [storageKey]);
  // persist on change per date
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ deposit }));
    } catch {}
  }, [storageKey, deposit]);

  const today = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const todays = invoices.filter(inv => {
      const d = new Date(inv.createdAt as any);
      return d >= start && d < end;
    });
    let totalSales = 0;
    let totalCost = 0;
    const pay = { cash: 0, bank: 0, mobile: 0, point: 0, other: 0 } as Record<string, number>;
    const invCount = { cash: 0, bank: 0, mobile: 0, point: 0, other: 0, total: todays.length } as Record<string, number>;
    for (const inv of todays) {
      totalSales += parseFloat(inv.total as string);
      const items = (inv.items as any[]) || [];
      for (const it of items) {
        const qty = it.quantity || 0;
        const c = parseFloat(it.costPrice || "0");
        totalCost += qty * c;
      }
      const pays = (inv.payments as any[]) || [];
      let hasCash=false, hasBank=false, hasMobile=false, hasPoint=false, hasOther=false;
      for (const p of pays) {
        const m = String(p.method || "").toLowerCase();
        const amt = parseFloat(p.amount || "0");
        if (m.includes("cash")) { pay.cash += amt; hasCash = true; }
        else if (m.includes("bank") || m.includes("card")) { pay.bank += amt; hasBank = true; }
        else if (m.includes("mobile") || m.includes("bkash") || m.includes("nagad") || m.includes("rocket")) { pay.mobile += amt; hasMobile = true; }
        else if (m.includes("point")) { pay.point += amt; hasPoint = true; }
        else { pay.other += amt; hasOther = true; }
      }
      if (hasCash) invCount.cash += 1;
      if (hasBank) invCount.bank += 1;
      if (hasMobile) invCount.mobile += 1;
      if (hasPoint) invCount.point += 1;
      if (hasOther) invCount.other += 1;
    }
    const earn = totalSales - totalCost;
    return { totalSales, totalCost, earn, pay, invCount };
  }, [invoices, selectedDate]);

  return (
    <div className="flex gap-2 justify-end flex-wrap">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">Today Cash</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Today Cash Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Date</span>
              <input type="date" className="border rounded px-2 py-1 text-sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="flex items-center justify-between"><span>Total Sales</span><span className="font-mono">${today.totalSales.toFixed(2)}</span></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between"><span>Cash</span><span className="font-mono">${today.pay.cash.toFixed(2)}</span></div>
                <div className="text-xs text-muted-foreground">Invoices: {today.invCount.cash}</div>
              </div>
              <div>
                <div className="flex items-center justify-between"><span>Bank</span><span className="font-mono">${today.pay.bank.toFixed(2)}</span></div>
                <div className="text-xs text-muted-foreground">Invoices: {today.invCount.bank}</div>
              </div>
              <div>
                <div className="flex items-center justify-between"><span>Mobile</span><span className="font-mono">${today.pay.mobile.toFixed(2)}</span></div>
                <div className="text-xs text-muted-foreground">Invoices: {today.invCount.mobile}</div>
              </div>
              <div>
                <div className="flex items-center justify-between"><span>Point</span><span className="font-mono">${today.pay.point.toFixed(2)}</span></div>
                <div className="text-xs text-muted-foreground">Invoices: {today.invCount.point}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Total invoices today: {today.invCount.total}</div>
            {today.pay.other > 0 && (
              <div className="flex items-center justify-between"><span>Other</span><span className="font-mono">${today.pay.other.toFixed(2)}</span></div>
            )}
            <div className="h-px bg-border" />
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Deposit (Bank + Mobile)</div>
              <label className="flex items-center justify-between gap-3">
                <span>Total Deposit</span>
                <input type="number" min="0" step="0.01" className="w-40 border rounded px-2 py-1 font-mono" value={deposit} onChange={(e) => setDeposit(Number(e.target.value || 0))} />
              </label>
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-1">
              <div className="flex items-center justify-between"><span>Total Cost</span><span className="font-mono">${today.totalCost.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Earn</span><span className="font-mono font-semibold">${today.earn.toFixed(2)}</span></div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-base font-medium">
              <span>Net Cash In Hand</span>
              <span className="font-mono">
                ${Math.max(0, today.pay.cash - deposit).toFixed(2)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Button size="sm" variant="default" onClick={onToggleAll}>{showAll ? "Hide All Invoices" : "All Invoices"}</Button>
      <Button size="sm" variant="outline" onClick={onExport}>Export CSV</Button>
      <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
    </div>
  );
}

function exportCSV(invoices: Invoice[], filters?: ReportFilters) {
  try {
    // Simple filter clone (match RevenueChart logic subset)
    let list = invoices.slice();
    if (filters?.dateFrom) list = list.filter(inv => new Date(inv.createdAt as any) >= filters.dateFrom!);
    if (filters?.dateTo) list = list.filter(inv => new Date(inv.createdAt as any) <= filters.dateTo!);
    const rows: string[] = [];
    rows.push(["Invoice #","Date","Customer","Staff","Subtotal","Tax","Discount","Total","Payment Methods"].join(","));
    for (const inv of list) {
      const pays = (inv.payments as any[]) || [];
      const pm = pays.map(p => `${p.method}:${p.amount}`).join("|");
      rows.push([
        JSON.stringify((inv.invoiceNumber as any) || inv.id),
        JSON.stringify(new Date(inv.createdAt as any).toISOString()),
        JSON.stringify((inv.customerName as any) || ""),
        JSON.stringify((inv.staffName as any) || ""),
        String(inv.subtotal),
        String(inv.taxAmount),
        String(inv.discountAmount),
        String(inv.total),
        JSON.stringify(pm),
      ].join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch {}
}

function AllInvoicesTable({ invoices, search, onSearch, page, onPageChange, pageSize, onEdit, onDelete }: {
  invoices: Invoice[];
  search: string;
  onSearch: (q: string) => void;
  page: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onEdit: (inv: Invoice) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) =>
      String(inv.invoiceNumber || inv.id).toLowerCase().includes(q) ||
      String(inv.customerName || "").toLowerCase().includes(q) ||
      String(inv.staffName || "").toLowerCase().includes(q)
    );
  }, [invoices, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const list = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>All Invoices</span>
          <input
            value={search}
            onChange={(e) => { onSearch(e.target.value); onPageChange(1); }}
            placeholder="Search invoice #, customer, staff"
            className="border rounded px-2 py-1 text-sm w-64"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2 pr-2">Invoice #</th>
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Customer</th>
                <th className="py-2 pr-2">Staff</th>
                <th className="py-2 pr-2 text-right">Total</th>
                <th className="py-2 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 pr-2 font-medium">{(inv.invoiceNumber as any) || inv.id}</td>
                  <td className="py-2 pr-2">{new Date(inv.createdAt as any).toLocaleString()}</td>
                  <td className="py-2 pr-2">{(inv.customerName as any) || "—"}</td>
                  <td className="py-2 pr-2">{(inv.staffName as any) || "—"}</td>
                  <td className="py-2 pr-2 text-right font-mono">${parseFloat(inv.total as string).toFixed(2)}</td>
                  <td className="py-2 pr-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <InvoicePreviewDialog invoice={inv} trigger={<Button size="sm" variant="outline">View</Button>} />
                      <Button size="sm" variant="outline" onClick={() => onEdit(inv)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(inv.id as string)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3 text-sm">
          <span className="text-muted-foreground">Page {pageSafe} / {totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => onPageChange(Math.max(1, pageSafe - 1))}>Prev</Button>
          <Button size="sm" variant="outline" onClick={() => onPageChange(Math.min(totalPages, pageSafe + 1))}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}
