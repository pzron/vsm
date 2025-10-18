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
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedPermissions = localStorage.getItem("permissions");
    if (storedUser && storedPermissions) {
      setUser(JSON.parse(storedUser));
      setPermissions(JSON.parse(storedPermissions));
    }
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
    setUser(null);
    setPermissions({});
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    setLocation("/login");
  };

  const hasPermission = (module: string, action: string) => {
    if (!permissions[module]) return false;
    return permissions[module][action as keyof typeof permissions[typeof module]] || false;
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
