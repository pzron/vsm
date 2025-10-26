import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export type Timeframe = "week" | "month" | "year";

export function SalesFilters({
  onChange,
}: {
  onChange: (f: { timeframe: Timeframe; customerType: string }) => void;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [customerType, setCustomerType] = useState<string>("All");

  useEffect(() => {
    onChange({ timeframe, customerType });
  }, [timeframe, customerType, onChange]);

  return (
    <Card>
      <CardContent className="p-3 flex flex-col sm:flex-row gap-3">
        <div className="space-y-1 w-full sm:w-52">
          <div className="text-xs text-muted-foreground">Timeframe</div>
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-full sm:w-60">
          <div className="text-xs text-muted-foreground">Customer Type</div>
          <Select value={customerType} onValueChange={(v) => setCustomerType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Member">Member</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="Wholesale">Wholesale</SelectItem>
              <SelectItem value="Dealer">Dealer</SelectItem>
              <SelectItem value="Depo">Depo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
