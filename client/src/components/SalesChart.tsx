import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function SalesChart() {
  // todo: remove mock functionality
  const dailyData = [
    { day: "Mon", sales: 4200, profit: 1800 },
    { day: "Tue", sales: 3800, profit: 1600 },
    { day: "Wed", sales: 5100, profit: 2300 },
    { day: "Thu", sales: 4600, profit: 2000 },
    { day: "Fri", sales: 6200, profit: 2800 },
    { day: "Sat", sales: 7800, profit: 3600 },
    { day: "Sun", sales: 5400, profit: 2400 },
  ];

  const monthlyData = [
    { month: "Jan", sales: 45000, profit: 18000 },
    { month: "Feb", sales: 52000, profit: 22000 },
    { month: "Mar", sales: 48000, profit: 19500 },
    { month: "Apr", sales: 61000, profit: 26000 },
    { month: "May", sales: 55000, profit: 23500 },
    { month: "Jun", sales: 67000, profit: 29000 },
  ];

  return (
    <Card data-testid="card-sales-chart">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Sales & Profit Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="mb-4">
            <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" name="Sales" />
                <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="monthly">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" name="Sales" />
                <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
