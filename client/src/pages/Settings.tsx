import { RolePermissionsCard } from "@/components/RolePermissionsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Download, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Settings() {
  const [store, setStore] = useState({
    name: "Vertex Life International Ltd.",
    address: "Madina Market, 2nd Floor, Muradpur, Panchlaish, Chittagong",
    phone: "+8801813142677",
    email: "contact@myvertexbd.com",
    website: "https://myvertexbd.com",
    logo: "",
  } as any);
  const [system, setSystem] = useState({
    autoLogout: true,
    stockAlerts: true,
    taxEnabled: true,
    taxRate: 10,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("settings_store");
      const rawSys = localStorage.getItem("settings_system");
      if (raw) setStore(JSON.parse(raw));
      if (rawSys) setSystem(JSON.parse(rawSys));
    } catch {}
  }, []);

  const saveAll = () => {
    localStorage.setItem("settings_store", JSON.stringify(store));
    localStorage.setItem("settings_system", JSON.stringify(system));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const onBackup = () => {
    const payload = {
      store,
      system,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settings-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const onRestore = () => fileInputRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result || "{}"));
        if (obj.store) setStore(obj.store);
        if (obj.system) setSystem(obj.system);
        saveAll();
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure system preferences, roles, and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-store-settings">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>Update your store details and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" value={store.name} onChange={(e) => setStore((s: any) => ({ ...s, name: e.target.value }))} data-testid="input-store-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">Address</Label>
              <Input id="store-address" value={store.address} onChange={(e) => setStore((s: any) => ({ ...s, address: e.target.value }))} data-testid="input-store-address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-phone">Phone</Label>
                <Input id="store-phone" value={store.phone} onChange={(e) => setStore((s: any) => ({ ...s, phone: e.target.value }))} data-testid="input-store-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-email">Email</Label>
                <Input id="store-email" type="email" value={store.email} onChange={(e) => setStore((s: any) => ({ ...s, email: e.target.value }))} data-testid="input-store-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-website">Website</Label>
                <Input id="store-website" value={store.website || ""} onChange={(e) => setStore((s: any) => ({ ...s, website: e.target.value }))} data-testid="input-store-website" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-logo">Logo URL</Label>
                <Input id="store-logo" value={store.logo || ""} onChange={(e) => setStore((s: any) => ({ ...s, logo: e.target.value }))} placeholder="https://..." data-testid="input-store-logo" />
              </div>
            </div>
            <Button className="w-full" onClick={saveAll} data-testid="button-save-store">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-system-settings">
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure application behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Logout</Label>
                <p className="text-sm text-muted-foreground">Logout after inactivity</p>
              </div>
              <Switch checked={system.autoLogout} onCheckedChange={(v) => setSystem(s => ({ ...s, autoLogout: v }))} data-testid="switch-auto-logout" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Email notifications for low stock</p>
              </div>
              <Switch checked={system.stockAlerts} onCheckedChange={(v) => setSystem(s => ({ ...s, stockAlerts: v }))} data-testid="switch-stock-alerts" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tax Calculation</Label>
                <p className="text-sm text-muted-foreground">Enable automatic tax</p>
              </div>
              <Switch checked={system.taxEnabled} onCheckedChange={(v) => setSystem(s => ({ ...s, taxEnabled: v }))} data-testid="switch-tax" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
              <Input id="tax-rate" type="number" value={system.taxRate} onChange={(e) => setSystem(s => ({ ...s, taxRate: Number(e.target.value) }))} data-testid="input-tax-rate" />
            </div>
          </CardContent>
        </Card>
      </div>

      <RolePermissionsCard />

      <Card data-testid="card-backup">
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>Manage your data backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onBackup} data-testid="button-backup">
              <Download className="h-4 w-4 mr-2" />
              Download Backup
            </Button>
            <Button variant="outline" className="flex-1" onClick={onRestore} data-testid="button-restore">
              <Upload className="h-4 w-4 mr-2" />
              Restore from Backup
            </Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFile} />
          </div>
          <p className="text-sm text-muted-foreground">
            Last backup: Today at 3:00 AM
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
