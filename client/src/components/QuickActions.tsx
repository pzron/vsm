import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, Package } from "lucide-react";

export function QuickActions() {
  const actions = [
    { icon: Package, label: "Add Product", color: "text-chart-1" },
    { icon: FileText, label: "New Invoice", color: "text-chart-2" },
    { icon: Users, label: "Add Customer", color: "text-chart-3" },
    { icon: Plus, label: "Stock Adjust", color: "text-chart-4" },
  ];

  return (
    <Card data-testid="card-quick-actions">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-24 flex flex-col gap-2 hover-elevate"
              onClick={() => console.log(`${action.label} clicked`)}
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
