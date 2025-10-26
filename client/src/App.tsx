import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Invoicing from "@/pages/Invoicing";
import Inventory from "@/pages/Inventory";
import Customers from "@/pages/Customers";
import Sales from "@/pages/Sales";
import Reports from "@/pages/Reports";
import Staff from "@/pages/Staff";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, requiredModule }: { component: () => JSX.Element; requiredModule?: string }) {
  const { isAuthenticated, hasPermission } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (isAuthenticated && requiredModule && !hasPermission(requiredModule, "view")) {
      // redirect to first allowed route
      const perms = JSON.parse(localStorage.getItem("permissions") || "{}");
      const routes: Array<{ mod: string; path: string }> = [
        { mod: "Dashboard", path: "/" },
        { mod: "Invoicing", path: "/invoicing" },
        { mod: "Products", path: "/products" },
        { mod: "Inventory", path: "/inventory" },
        { mod: "Customers", path: "/customers" },
        { mod: "Sales", path: "/sales" },
        { mod: "Reports", path: "/reports" },
        { mod: "Staff", path: "/staff" },
        { mod: "Settings", path: "/settings" },
      ];
      const dest = routes.find(r => r.mod === "Dashboard" || (perms[r.mod] && perms[r.mod].view))?.path || "/";
      setLocation(dest);
    }
  }, [isAuthenticated, requiredModule, hasPermission, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">{() => <ProtectedRoute component={Dashboard} requiredModule="Dashboard" />}</Route>
      <Route path="/products">{() => <ProtectedRoute component={Products} requiredModule="Products" />}</Route>
      <Route path="/invoicing">{() => <ProtectedRoute component={Invoicing} requiredModule="Invoices" />}</Route>
      <Route path="/inventory">{() => <ProtectedRoute component={Inventory} requiredModule="Inventory" />}</Route>
      <Route path="/customers">{() => <ProtectedRoute component={Customers} requiredModule="Customers" />}</Route>
      <Route path="/sales">{() => <ProtectedRoute component={Sales} requiredModule="Sales" />}</Route>
      <Route path="/reports">{() => <ProtectedRoute component={Reports} requiredModule="Reports" />}</Route>
      <Route path="/staff">{() => <ProtectedRoute component={Staff} requiredModule="Staff" />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} requiredModule="Settings" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isInvoicing = location === "/invoicing";
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (location === "/login") {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              {!isInvoicing && user && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{user.fullName}</span>
                  <span className="text-muted-foreground">({user.role})</span>
                </div>
              )}
              <ThemeToggle />
              {!isInvoicing && (
                <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
