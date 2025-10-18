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
import { Edit, Trash2, Search, Plus, DollarSign } from "lucide-react";
import { useState } from "react";

interface Staff {
  id: string;
  name: string;
  role: "Admin" | "Manager" | "Cashier" | "Accountant";
  email: string;
  phone: string;
  salary: string;
  invoicesCreated: number;
  status: "Active" | "Inactive";
}

export function StaffTable() {
  const [search, setSearch] = useState("");

  // todo: remove mock functionality
  const staff: Staff[] = [
    { id: "1", name: "John Doe", role: "Manager", email: "john.d@store.com", phone: "+1-555-0201", salary: "$4,500", invoicesCreated: 234, status: "Active" },
    { id: "2", name: "Jane Smith", role: "Cashier", email: "jane.s@store.com", phone: "+1-555-0202", salary: "$3,200", invoicesCreated: 456, status: "Active" },
    { id: "3", name: "Mike Chen", role: "Accountant", email: "mike.c@store.com", phone: "+1-555-0203", salary: "$3,800", invoicesCreated: 89, status: "Active" },
    { id: "4", name: "Sarah Johnson", role: "Cashier", email: "sarah.j@store.com", phone: "+1-555-0204", salary: "$3,000", invoicesCreated: 321, status: "Inactive" },
  ];

  const getRoleColor = (role: Staff["role"]) => {
    switch (role) {
      case "Admin": return "default";
      case "Manager": return "secondary";
      case "Cashier": return "outline";
      case "Accountant": return "outline";
    }
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
        <Button data-testid="button-add-staff">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Monthly Salary</TableHead>
              <TableHead>Invoices Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((employee) => {
              const initials = employee.name.split(" ").map(n => n[0]).join("");
              return (
                <TableRow key={employee.id} data-testid={`row-staff-${employee.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleColor(employee.role)}>
                      {employee.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{employee.email}</div>
                      <div className="text-muted-foreground">{employee.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono font-semibold">{employee.salary}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{employee.invoicesCreated}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-edit-${employee.id}`}
                        onClick={() => console.log("Edit", employee.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-${employee.id}`}
                        onClick={() => console.log("Delete", employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
