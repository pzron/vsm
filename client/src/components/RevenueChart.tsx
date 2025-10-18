import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

interface RevenueChartProps {
  data?: Array<{ name: string; revenue: number; cost: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [period, setPeriod] = useState("week");

  // todo: remove mock functionality
  const defaultData = [
    { name: "Mon", revenue: 4200, cost: 2400 },
    { name: "Tue", revenue: 3800, cost: 2200 },
    { name: "Wed", revenue: 5100, cost: 2800 },
    { name: "Thu", revenue: 4600, cost: 2600 },
    { name: "Fri", revenue: 6200, cost: 3400 },
    { name: "Sat", revenue: 7800, cost: 4200 },
    { name: "Sun", revenue: 5400, cost: 3000 },
  ];

  const chartData = data || defaultData;

  return (
    <Card data-testid="card-revenue-chart">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Revenue Trends</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32" data-testid="select-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              name="Cost"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
