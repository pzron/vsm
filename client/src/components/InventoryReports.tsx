import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function InventoryReports() {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const now = new Date();

  const expiryNear = products
    .filter(p => !!p.expiryDate)
    .filter(p => {
      const exp = new Date(p.expiryDate as any);
      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30; // next 30 days
    })
    .map(p => ({ id: p.id, name: p.name, category: p.category, expiryDate: p.expiryDate }))
    .sort((a, b) => new Date(a.expiryDate as any).getTime() - new Date(b.expiryDate as any).getTime());

  const understock = products.filter(p => (p.currentStock || 0) < (p.minStock || 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Expiry Near (30 days)">
        <div className="space-y-2 text-sm">
          {expiryNear.map(s => (
            <div key={s.id} className="flex items-center justify-between border rounded p-2">
              <div className="font-medium">{s.name}</div>
              <div className="font-mono">{new Date(s.expiryDate as any).toLocaleDateString()}</div>
            </div>
          ))}
          {expiryNear.length === 0 && <div className="text-muted-foreground">No upcoming expiries.</div>}
        </div>
      </Section>

      <Section title="Understock Products">
        <div className="space-y-2 text-sm">
          {understock.map(p => (
            <div key={p.id} className="flex items-center justify-between border rounded p-2">
              <div className="font-medium">{p.name}</div>
              <div className="font-mono">{p.currentStock} / min {p.minStock}</div>
            </div>
          ))}
          {understock.length === 0 && <div className="text-muted-foreground">No understock items.</div>}
        </div>
      </Section>
    </div>
  );
}
