import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Search, Plus, DollarSign, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { AddStaffDialog } from "@/components/AddStaffDialog";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { EditStaffDialog } from "@/components/EditStaffDialog";
import type { Invoice } from "@shared/schema";

export function StaffTable() {
  const [search, setSearch] = useState("");
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/staff"],
  });
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });

  const invoiceCountByStaff = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      const sid = String((inv as any).staffId || "");
      if (!sid) continue;
      map.set(sid, (map.get(sid) || 0) + 1);
    }
    return map;
  }, [invoices]);

  const salesByStaff = useMemo(() => {
    const totals = new Map<string, number>();
    const profits = new Map<string, number>();
    for (const inv of invoices) {
      const sid = String((inv as any).staffId || "");
      if (!sid) continue;
      const total = parseFloat(inv.total as string);
      const profit = (inv.items as any[]).reduce((sum, it) => sum + (parseFloat(it.price) - parseFloat(it.costPrice || "0")) * (it.quantity || 0), 0);
      totals.set(sid, (totals.get(sid) || 0) + total);
      profits.set(sid, (profits.get(sid) || 0) + profit);
    }
    return { totals, profits };
  }, [invoices]);

  const filteredStaff = useMemo(() => {
    if (!search) return staff;
    
    const searchLower = search.toLowerCase();
    return staff.filter((employee) => 
      employee.fullName.toLowerCase().includes(searchLower) ||
      employee.username.toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower) ||
      employee.email?.toLowerCase().includes(searchLower) ||
      employee.phone?.toLowerCase().includes(searchLower)
    );
  }, [staff, search]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "default";
      case "Manager": return "secondary";
      case "Cashier": return "outline";
      case "Accountant": return "outline";
      default: return "outline";
    }
  };

  const formatSalary = (salary: string | null) => {
    if (!salary) return "$0";
    const amount = parseFloat(salary);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4" data-testid="staff-table">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-staff"
          />
        </div>
        {hasPermission("Staff", "add") && (
          <AddStaffDialog
            trigger={
              <Button data-testid="button-add-staff">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            }
          />
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Monthly Salary</TableHead>
              <TableHead>Total Paid</TableHead>
              <TableHead>Total Sales</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Invoices Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-9" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p className="text-sm">
                      {search ? "No staff members found matching your search" : "No staff members found"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((employee) => {
                const initials = employee.fullName.split(" ").map(n => n[0]).join("");
                return (
                  <TableRow key={employee.id} data-testid={`row-staff-${employee.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">@{employee.username}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleColor(employee.role)}>
                        {employee.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{employee.email || "—"}</div>
                        <div className="text-muted-foreground">{employee.phone || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono font-semibold">{formatSalary(employee.salary)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono font-semibold">{formatSalary((employee as any).totalPaid || "0")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">${(salesByStaff.totals.get(employee.id) || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${(salesByStaff.profits.get(employee.id) || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-mono">{invoiceCountByStaff.get(employee.id) || 0}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission("Staff", "edit") && (
                          <EditStaffDialog
                            user={employee}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-note-${employee.id}`}
                              >
                                Note
                              </Button>
                            }
                          />
                        )}
                        {hasPermission("Staff", "edit") && (
                          <EditStaffDialog
                            user={employee}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-edit-${employee.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )}
                        {hasPermission("Staff", "delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-${employee.id}`}
                            onClick={async () => {
                              if (!confirm("Delete this staff member?")) return;
                              await apiRequest("DELETE", `/api/staff/${employee.id}`);
                              await queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
