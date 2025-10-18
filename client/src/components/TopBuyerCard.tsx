import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TopBuyer {
  name: string;
  email: string;
  totalSpent: string;
  purchases: number;
  type: string;
  avatar?: string;
}

interface TopBuyerCardProps {
  buyer?: TopBuyer;
}

export function TopBuyerCard({ buyer }: TopBuyerCardProps) {
  // todo: remove mock functionality
  const defaultBuyer = {
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    totalSpent: "$3,450",
    purchases: 24,
    type: "VIP",
  };

  const topBuyer = buyer || defaultBuyer;
  const initials = topBuyer.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Card data-testid="card-top-buyer">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Top Buyer This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={buyer?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{topBuyer.name}</p>
              <Badge variant="default" className="text-xs">
                {topBuyer.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{topBuyer.email}</p>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="font-mono font-semibold">{topBuyer.totalSpent}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Purchases</p>
                <p className="font-semibold">{topBuyer.purchases}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
