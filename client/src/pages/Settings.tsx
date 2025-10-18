import { RolePermissionsCard } from "@/components/RolePermissionsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Download, Upload } from "lucide-react";

export default function Settings() {
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
              <Input id="store-name" defaultValue="Store Manager Pro" data-testid="input-store-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">Address</Label>
              <Input id="store-address" defaultValue="123 Main Street, City, Country" data-testid="input-store-address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-phone">Phone</Label>
                <Input id="store-phone" defaultValue="+1-555-0100" data-testid="input-store-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-email">Email</Label>
                <Input id="store-email" type="email" defaultValue="contact@store.com" data-testid="input-store-email" />
              </div>
            </div>
            <Button className="w-full" data-testid="button-save-store">
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
              <Switch defaultChecked data-testid="switch-auto-logout" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Email notifications for low stock</p>
              </div>
              <Switch defaultChecked data-testid="switch-stock-alerts" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tax Calculation</Label>
                <p className="text-sm text-muted-foreground">Enable automatic tax</p>
              </div>
              <Switch defaultChecked data-testid="switch-tax" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
              <Input id="tax-rate" type="number" defaultValue="10" data-testid="input-tax-rate" />
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
            <Button variant="outline" className="flex-1" data-testid="button-backup">
              <Download className="h-4 w-4 mr-2" />
              Download Backup
            </Button>
            <Button variant="outline" className="flex-1" data-testid="button-restore">
              <Upload className="h-4 w-4 mr-2" />
              Restore from Backup
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Last backup: Today at 3:00 AM
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
