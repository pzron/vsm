import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Invoice, Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export function InvoicePreviewDialog({ invoice, trigger }: { invoice: Invoice; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const items = (invoice.items as any[]) || [];
  const rows = items.map((it, idx) => {
    const p = productMap.get(it.productId);
    const name = it.productName || p?.name || it.name || "";
    const price = parseFloat(String(it.price || 0));
    const qty = it.quantity || 0;
    const point = Number((it.point ?? it.points ?? (p as any)?.points) || 0);
    const totalPoint = point * qty;
    const totalPrice = price * qty;
    return { idx: idx + 1, name, point, price, qty, totalPoint, totalPrice };
  });

  const subtotal = rows.reduce((s, r) => s + r.totalPrice, 0);
  const totalPoints = rows.reduce((s, r) => s + r.totalPoint, 0);
  const total = parseFloat(String(invoice.total || subtotal));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl print:max-w-none">
        <DialogHeader>
          <DialogTitle>Invoice #{String((invoice.invoiceNumber as any) || invoice.id)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" id="invoice-print-area">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs text-muted-foreground">INVOICE TO:</div>
              <div className="text-xl font-semibold">{String((invoice.customerName as any) || "—")}</div>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium">Invoice #{String((invoice.invoiceNumber as any) || invoice.id)}</div>
              <div className="text-muted-foreground">Date of Invoice: {new Date(invoice.createdAt as any).toLocaleString()}</div>
            </div>
          </div>

          <div className="rounded border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Point</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total Point</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.idx}>
                    <TableCell className="font-mono text-xs">{r.idx}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.point}</TableCell>
                    <TableCell className="text-right font-mono">{r.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{r.qty}</TableCell>
                    <TableCell className="text-right font-mono">{r.totalPoint}</TableCell>
                    <TableCell className="text-right font-mono">{r.totalPrice.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No items.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Thank you!</div>
            <div className="text-sm">
              <div className="flex items-center justify-between gap-8">
                <div className="text-right">
                  <div className="text-muted-foreground">Subtotal</div>
                  <div className="text-muted-foreground">Total Point</div>
                  <div className="font-semibold">Grand Total</div>
                </div>
                <div className="text-right font-mono">
                  <div>${subtotal.toFixed(2)}</div>
                  <div>{totalPoints}</div>
                  <div className="font-semibold">${total.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-3">Invoice was created on a computer and is valid without the signature and seal.</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
