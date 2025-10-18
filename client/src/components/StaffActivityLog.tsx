import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, FileText, Package, Users } from "lucide-react";

interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: "invoice" | "product" | "customer" | "stock";
}

interface StaffActivityLogProps {
  activities?: Activity[];
}

export function StaffActivityLog({ activities }: StaffActivityLogProps) {
  // todo: remove mock functionality
  const defaultActivities: Activity[] = [
    { id: "1", user: "John Doe", action: "Created invoice #1234", time: "5 min ago", type: "invoice" },
    { id: "2", user: "Jane Smith", action: "Added new product", time: "12 min ago", type: "product" },
    { id: "3", user: "Mike Chen", action: "Updated customer info", time: "25 min ago", type: "customer" },
    { id: "4", user: "Sarah Johnson", action: "Adjusted stock levels", time: "1 hour ago", type: "stock" },
  ];

  const activityList = activities || defaultActivities;

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "invoice":
        return <FileText className="h-4 w-4" />;
      case "product":
        return <Package className="h-4 w-4" />;
      case "customer":
        return <Users className="h-4 w-4" />;
      case "stock":
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <Card data-testid="card-staff-activity">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Staff Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activityList.map((activity) => {
            const initials = activity.user
              .split(" ")
              .map((n) => n[0])
              .join("");

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3"
                data-testid={`activity-${activity.id}`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{activity.user}</span>
                    <div className="text-muted-foreground">{getIcon(activity.type)}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
