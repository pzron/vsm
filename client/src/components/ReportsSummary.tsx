import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice } from "@shared/schema";
import { format, startOfDay, startOfWeek, isAfter } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-mono font-semibold">{value}</div>
    </div>
  );
}

export function ReportsSummary() {
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const [range, setRange] = useState<"daily" | "weekly">("daily");
  const { user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  type CashEntry = { id: string; type: "earn" | "cost"; amount: number; note?: string; by?: string; at: string };
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [draft, setDraft] = useState<{ id?: string; type: "earn" | "cost"; amount: number; note: string }>({ type: "earn", amount: 0, note: "" });

  const periodKey = useMemo(() => {
    const now = new Date();
    const start = range === "daily" ? startOfDay(now) : startOfWeek(now, { weekStartsOn: 1 });
    return `cash_entries_${range}_${format(start, "yyyy-MM-dd")}`;
  }, [range]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(periodKey);
      setEntries(raw ? JSON.parse(raw) : []);
    } catch {
      setEntries([]);
    }
  }, [periodKey]);

  const saveEntries = (next: CashEntry[]) => {
    setEntries(next);
    localStorage.setItem(periodKey, JSON.stringify(next));
  };

  const { revenue, cost, profit, cash } = useMemo(() => {
    const now = new Date();
    const start = range === "daily" ? startOfDay(now) : startOfWeek(now, { weekStartsOn: 1 });
    let revenue = 0;
    let cost = 0;
    let profit = 0;
    let cash = 0;
    for (const inv of invoices) {
      const created = new Date(inv.createdAt as any);
      if (!isAfter(created, start) && format(created, "yyyy-MM-dd") !== format(start, "yyyy-MM-dd")) continue;
      const total = parseFloat(inv.total as string);
      revenue += total;
      const items = inv.items as any[];
      const invCost = items.reduce((sum, it) => sum + parseFloat(it.costPrice || "0") * (it.quantity || 0), 0);
      cost += invCost;
      profit += (total - invCost);
      const pays = (inv.payments as any[]) || [];
      for (const p of pays) {
        if ((p.method || "").toLowerCase().includes("cash")) {
          cash += parseFloat(p.amount || "0");
        }
      }
    }
    // include manual cash entries
    for (const e of entries) {
      if (e.type === "earn") {
        revenue += e.amount;
        profit += e.amount; // treat manual earn as pure margin unless otherwise modeled
        cash += e.amount;
      } else {
        cost += e.amount;
        profit -= e.amount;
        cash -= 0; // assuming cost may not affect cash directly, adjust to your policy
      }
    }
    return { revenue, cost, profit, cash };
  }, [invoices, range, entries]);

  return (
    <Card data-testid="card-reports-summary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Cash Count & Profitability</CardTitle>
          <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
            <TabsList>
              <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Dialog open={manageOpen} onOpenChange={setManageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Manage Entries</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Cash Entries ({range})</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" onClick={() => setDraft({ type: "earn", amount: 0, note: "" })}>Add Earn</Button>
                  <Button type="button" variant="secondary" onClick={() => setDraft({ type: "cost", amount: 0, note: "" })}>Add Cost</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Input value={draft.type} readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Note</Label>
                  <Textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDraft({ type: "earn", amount: 0, note: "" })}>Reset</Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!draft.amount || draft.amount <= 0) return;
                      const next: CashEntry = { id: draft.id || String(Date.now()), type: draft.type, amount: draft.amount, note: draft.note, by: user?.fullName || "System", at: new Date().toISOString() };
                      const merged = draft.id ? entries.map(e => e.id === draft.id ? next : e) : [...entries, next];
                      saveEntries(merged);
                      setDraft({ type: "earn", amount: 0, note: "" });
                    }}
                  >
                    Save Entry
                  </Button>
                </div>
                <div className="space-y-2">
                  {entries.length === 0 && <div className="text-sm text-muted-foreground">No manual entries yet.</div>}
                  {entries.map((e) => (
                    <div key={e.id} className="border rounded p-2 text-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium">{e.type.toUpperCase()} - ${e.amount.toFixed(2)}</div>
                        <div className="text-muted-foreground">{e.note || "—"}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDraft({ id: e.id, type: e.type, amount: e.amount, note: e.note || "" })}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => saveEntries(entries.filter(x => x.id !== e.id))}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={() => { setManageOpen(true); setDraft({ type: "earn", amount: 0, note: "" }); }}>Add Earn</Button>
          <Button size="sm" onClick={() => { setManageOpen(true); setDraft({ type: "cost", amount: 0, note: "" }); }}>Add Cost</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Revenue (Earn)" value={`$${revenue.toFixed(2)}`} />
          <Stat label="Cost" value={`$${cost.toFixed(2)}`} />
          {isAdmin && <Stat label="Profit" value={`$${profit.toFixed(2)}`} />}
          <Stat label="Cash Count" value={`$${cash.toFixed(2)}`} />
        </div>
      </CardContent>
    </Card>
  );
}
