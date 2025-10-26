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
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@shared/schema";

type PermissionFlags = { view: boolean; add: boolean; edit: boolean; delete: boolean };
type RoleRecord = { role: string; permissions: Record<string, PermissionFlags> };

export function RolePermissionsCard({ enableUserAccess = true }: { enableUserAccess?: boolean }) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const modules = [
    "Products",
    "Invoices",
    "Inventory",
    "Customers",
    "Sales",
    "Reports",
    "Staff",
    "Settings",
    "Dashboard",
  ];

  const { data: roles = [] } = useQuery<RoleRecord[]>({ queryKey: ["/api/roles"] });
  const { data: staff = [] } = useQuery<User[]>({ queryKey: ["/api/staff"] });
  const [selectedRole, setSelectedRole] = useState<string>("");
  const selected = useMemo(
    () => roles.find((r) => r.role === selectedRole) || null,
    [roles, selectedRole]
  );
  const [working, setWorking] = useState<Record<string, PermissionFlags>>({});

  // User access assignment (top-level hooks)
  const [userQuery, setUserQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assignRole, setAssignRole] = useState<string>("");
  useEffect(() => {
    if (roles.length && !assignRole) setAssignRole(roles[0]?.role || "");
  }, [roles, assignRole]);
  const filteredUsers = useMemo(() => {
    const q = userQuery.toLowerCase();
    return staff
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [staff, userQuery]);
  const pickUser = (u: User) => {
    setUserQuery(`${u.username}`);
    setSelectedUserId(u.id);
  };
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId || !assignRole) return;
      await apiRequest("PATCH", `/api/staff/${selectedUserId}`, { role: assignRole });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setSelectedUserId("");
      setUserQuery("");
    },
  });

  useEffect(() => {
    if (!selected && roles.length) {
      setSelectedRole(roles[0].role);
    }
  }, [roles, selected]);

  useEffect(() => {
    if (selected) {
      // ensure all modules represented
      const merged: Record<string, PermissionFlags> = {};
      modules.forEach((m) => {
        merged[m] = selected.permissions[m] || { view: false, add: false, edit: false, delete: false };
      });
      setWorking(merged);
    }
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await apiRequest("PATCH", `/api/roles/${encodeURIComponent(selected.role)}`, {
        role: selected.role,
        permissions: working,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
    },
  });

  const [newRole, setNewRole] = useState("");
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: RoleRecord = {
        role: newRole,
        permissions: modules.reduce((acc, m) => {
          acc[m] = { view: false, add: false, edit: false, delete: false };
          return acc;
        }, {} as Record<string, PermissionFlags>),
      };
      await apiRequest("POST", "/api/roles", payload);
    },
    onSuccess: async () => {
      setNewRole("");
      await queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
    },
  });

  const togglePermission = (module: string, field: keyof PermissionFlags) => {
    setWorking((prev) => ({
      ...prev,
      [module]: { ...prev[module], [field]: !prev[module][field] },
    }));
  };

  return (
    <>
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
              {roles.map((r) => (
                <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>
              ))}
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

          {modules.map((mod) => (
            <div key={mod} className="grid grid-cols-5 gap-2 items-center py-2 border-t" data-testid={`permission-row-${mod.toLowerCase()}`}>
              <Label className="text-sm font-medium">{mod}</Label>
              <div className="flex justify-center">
                <Switch checked={!!working[mod]?.view} onCheckedChange={() => togglePermission(mod, 'view')} data-testid={`switch-view-${mod.toLowerCase()}`} />
              </div>
              <div className="flex justify-center">
                <Switch checked={!!working[mod]?.add} onCheckedChange={() => togglePermission(mod, 'add')} data-testid={`switch-add-${mod.toLowerCase()}`} />
              </div>
              <div className="flex justify-center">
                <Switch checked={!!working[mod]?.edit} onCheckedChange={() => togglePermission(mod, 'edit')} data-testid={`switch-edit-${mod.toLowerCase()}`} />
              </div>
              <div className="flex justify-center">
                <Switch checked={!!working[mod]?.delete} onCheckedChange={() => togglePermission(mod, 'delete')} data-testid={`switch-delete-${mod.toLowerCase()}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-3">
          {hasPermission("Roles", "add") || hasPermission("Settings", "edit") ? (
            <Button onClick={() => saveMutation.mutate()} disabled={!selected || saveMutation.isPending}>Save</Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Create New Role</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input placeholder="Role name" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
        <Button onClick={() => createMutation.mutate()} disabled={!newRole.trim() || createMutation.isPending}>Create</Button>
      </CardContent>
    </Card>
    {enableUserAccess && (
      <Card className="mt-4" data-testid="card-user-access">
        <CardHeader>
          <CardTitle className="text-lg">User Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label>Mention username</Label>
              <Input
                placeholder="Type username or full name"
                value={userQuery}
                onChange={(e) => { setUserQuery(e.target.value); setSelectedUserId(""); }}
                data-testid="input-mention-username"
              />
              {userQuery && filteredUsers.length > 0 && (
                <div className="mt-1 border rounded p-2 space-y-1 max-h-40 overflow-auto">
                  {filteredUsers.map(u => (
                    <button key={u.id} type="button" className="flex w-full items-center justify-between text-left hover:bg-accent rounded px-2 py-1" onClick={() => pickUser(u)}>
                      <span className="text-sm">@{u.username} — {u.fullName}</span>
                      <span className="text-xs text-muted-foreground">{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label>Assign Role</Label>
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger data-testid="select-assign-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => assignMutation.mutate()} disabled={!selectedUserId || !assignRole || assignMutation.isPending} data-testid="button-assign-role">
              Assign Role
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Usernames are unique and enforced by the system.</p>
        </CardContent>
      </Card>
    )}
    </>
  );
}
