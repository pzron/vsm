import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    trend: "up" | "down";
  };
  icon: LucideIcon;
  iconColor?: string;
  variant?: "blue" | "green" | "purple" | "orange" | "red" | "pink" | "teal";
  live?: boolean;
}

export function StatCard({ title, value, change, icon: Icon, iconColor = "text-primary", variant = "blue", live = false }: StatCardProps) {
  const gradient = {
    blue: "from-blue-500/10 via-blue-500/5 to-transparent",
    green: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    purple: "from-purple-500/10 via-purple-500/5 to-transparent",
    orange: "from-orange-500/10 via-orange-500/5 to-transparent",
    red: "from-rose-500/10 via-rose-500/5 to-transparent",
    pink: "from-pink-500/10 via-pink-500/5 to-transparent",
    teal: "from-teal-500/10 via-teal-500/5 to-transparent",
  }[variant];

  return (
    <Card
      data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "relative overflow-hidden transition-shadow hover:shadow-lg",
        "border-muted/60"
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", gradient)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {live && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          )}
        </div>
        <Icon className={cn("h-4 w-4 md:h-5 md:w-5", iconColor)} />
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold font-mono tracking-tight">{value}</div>
        {change && (
          <p className={cn(
            "text-xs font-medium mt-1",
            change.trend === "up" ? "text-success" : "text-destructive"
          )}>
            {change.trend === "up" ? "+" : "-"}{change.value} from yesterday
          </p>
        )}
      </CardContent>
    </Card>
  );
}
