import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  threshold: number;
}

interface LowStockAlertProps {
  items?: LowStockItem[];
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  // todo: remove mock functionality
  const defaultItems = [
    { id: "1", name: "USB Cable Type-C", currentStock: 5, threshold: 20 },
    { id: "2", name: "AA Batteries Pack", currentStock: 8, threshold: 25 },
    { id: "3", name: "Notebook A4", currentStock: 3, threshold: 15 },
    { id: "4", name: "Ballpoint Pen Blue", currentStock: 12, threshold: 30 },
  ];

  const stockItems = items || defaultItems;

  return (
    <Card data-testid="card-low-stock">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Low Stock Alerts</CardTitle>
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {stockItems.length}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stockItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-md border hover-elevate"
              data-testid={`low-stock-item-${item.id}`}
            >
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Stock: {item.currentStock} / Min: {item.threshold}
                </p>
              </div>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                Low
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
