import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export function QuickActions() {
  const { hasPermission } = useAuth();
  const [, setLocation] = useLocation();

  const actions = [
    { icon: Package, label: "Add Product", color: "text-chart-1", module: "Products", path: "/products", required: "add" },
    { icon: FileText, label: "New Invoice", color: "text-chart-2", module: "Invoices", path: "/invoicing", required: "add" },
    { icon: Users, label: "Add Customer", color: "text-chart-3", module: "Customers", path: "/customers", required: "add" },
    { icon: Plus, label: "Stock Adjust", color: "text-chart-4", module: "Inventory", path: "/inventory", required: "add" },
  ] as const;

  return (
    <Card data-testid="card-quick-actions">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions
            .filter(a => hasPermission(a.module, a.required))
            .map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-24 flex flex-col gap-2 hover-elevate"
                onClick={() => setLocation(action.path)}
                data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <action.icon className={`h-6 w-6 ${action.color}`} />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
