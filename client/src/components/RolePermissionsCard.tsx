import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface Permission {
  module: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export function RolePermissionsCard() {
  const [selectedRole, setSelectedRole] = useState("manager");
  
  // todo: remove mock functionality
  const [permissions, setPermissions] = useState<Permission[]>([
    { module: "Products", view: true, add: true, edit: true, delete: false },
    { module: "Invoices", view: true, add: true, edit: true, delete: false },
    { module: "Inventory", view: true, add: true, edit: true, delete: false },
    { module: "Customers", view: true, add: true, edit: true, delete: false },
    { module: "Sales", view: true, add: false, edit: false, delete: false },
    { module: "Reports", view: true, add: false, edit: false, delete: false },
    { module: "Staff", view: false, add: false, edit: false, delete: false },
    { module: "Settings", view: false, add: false, edit: false, delete: false },
  ]);

  const togglePermission = (index: number, field: keyof Omit<Permission, 'module'>) => {
    const newPermissions = [...permissions];
    newPermissions[index][field] = !newPermissions[index][field];
    setPermissions(newPermissions);
    console.log(`Toggle ${field} for ${permissions[index].module}`);
  };

  return (
    <Card data-testid="card-role-permissions">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Role & Permissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">Select Role</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role" data-testid="select-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="cashier">Cashier</SelectItem>
              <SelectItem value="accountant">Accountant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2">
            <div>Module</div>
            <div className="text-center">View</div>
            <div className="text-center">Add</div>
            <div className="text-center">Edit</div>
            <div className="text-center">Delete</div>
          </div>

          {permissions.map((perm, index) => (
            <div
              key={perm.module}
              className="grid grid-cols-5 gap-2 items-center py-2 border-t"
              data-testid={`permission-row-${perm.module.toLowerCase()}`}
            >
              <Label className="text-sm font-medium">{perm.module}</Label>
              <div className="flex justify-center">
                <Switch
                  checked={perm.view}
                  onCheckedChange={() => togglePermission(index, 'view')}
                  data-testid={`switch-view-${perm.module.toLowerCase()}`}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={perm.add}
                  onCheckedChange={() => togglePermission(index, 'add')}
                  data-testid={`switch-add-${perm.module.toLowerCase()}`}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={perm.edit}
                  onCheckedChange={() => togglePermission(index, 'edit')}
                  data-testid={`switch-edit-${perm.module.toLowerCase()}`}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={perm.delete}
                  onCheckedChange={() => togglePermission(index, 'delete')}
                  data-testid={`switch-delete-${perm.module.toLowerCase()}`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
