import { StaffTable } from "@/components/StaffTable";
import { StatCard } from "@/components/StatCard";
import { StaffActivityLog } from "@/components/StaffActivityLog";
import { Users, UserCheck, TrendingUp, DollarSign } from "lucide-react";

export default function Staff() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <p className="text-muted-foreground">Manage employees, track performance, and monitor activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Staff"
          value="24"
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title="Active Today"
          value="18"
          icon={UserCheck}
          iconColor="text-success"
        />
        <StatCard
          title="Avg Performance"
          value="94%"
          change={{ value: "3%", trend: "up" }}
          icon={TrendingUp}
          iconColor="text-info"
        />
        <StatCard
          title="Monthly Payroll"
          value="$82,500"
          icon={DollarSign}
          iconColor="text-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StaffTable />
        </div>
        <StaffActivityLog />
      </div>
    </div>
  );
}
