import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
}

interface Permissions {
  [module: string]: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  permissions: Permissions;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [permissions, setPermissions] = useState<Permissions>(() => {
    try {
      const storedPermissions = localStorage.getItem("permissions");
      return storedPermissions ? JSON.parse(storedPermissions) : {};
    } catch {
      return {} as Permissions;
    }
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        if (!res.ok) throw new Error("unauth");
        const data = await res.json();
        if (!cancelled) {
          setUser(data.user);
          setPermissions(data.permissions || {});
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("permissions", JSON.stringify(data.permissions || {}));
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setPermissions({} as Permissions);
          localStorage.removeItem("user");
          localStorage.removeItem("permissions");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // keep state and localStorage in sync if changed in other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
      if (e.key === "permissions") {
        setPermissions(e.newValue ? JSON.parse(e.newValue) : {});
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    const data = await response.json();
    setUser(data.user);
    setPermissions(data.permissions || {});
    
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("permissions", JSON.stringify(data.permissions || {}));
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      setUser(null);
      setPermissions({} as Permissions);
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      setLocation("/login");
    });
  };

  const hasPermission = (module: string, action: string) => {
    const mod = permissions[module] as any;
    if (!mod) return false;
    return Boolean(mod[action]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
