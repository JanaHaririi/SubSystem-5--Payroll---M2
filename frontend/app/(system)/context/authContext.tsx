"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axiosInstance, {
  registerUnauthenticatedHandler,
} from "@/app/utils/ApiClient";
import { usePathname, useRouter } from "next/navigation";

type User = {
  userid?: string;
  role?: string;
  roles?: string[];
  name?: string;
  email: string;
  age?:number;
  userType?:"candidate";
  status?: string;
  candidateNumber?: string;
  employeeNumber?: string;
};


type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (employeeNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to normalize roles from backend into lowercase array
function normalizeRoles(user: User | null): string[] {
  if (!user) return [];
  if (Array.isArray(user.roles)) {
    return user.roles.map((r) => String(r).toLowerCase());
  }
  if (user.role) {
    return [String(user.role).toLowerCase()];
  }
  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchMe = async () => {
    try {
      const res = await axiosInstance.get<User>("/auth/me");
      setUser(res.data);
      console.log("fetch me", res);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load: check if we're logged in
  useEffect(() => {
    fetchMe();
  }, []);

  // Global 401 handler from axios
  useEffect(() => {
    const handleUnauthenticated = () => {
      console.log("unauthenticated – redirecting to /login");
      setUser(null);
      router.replace("/login");
    };

    registerUnauthenticatedHandler(handleUnauthenticated);
  }, [router]);

  // Revalidate auth on every route change (except auth pages)
  useEffect(() => {
    if (!pathname || pathname === "/login" || pathname === "/register") return;
    console.log("Route changed, revalidating /auth/me", pathname);

    axiosInstance
      .get<User>("/auth/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        setUser(null);
        router.replace("/login");
      });
  }, [pathname, router]);

  // Login: call backend, then redirect based on role
  const login = async (employeeNumber: string, password: string) => {
    // 1) Perform login (sets cookie on backend)
    await axiosInstance.post("/auth/login", { employeeNumber, password });

    // 2) Get current user
    const res = await axiosInstance.get<User>("/auth/me");
    const me = res.data;
    setUser(me);

    // 3) Decide where to send them
    const roles = normalizeRoles(me);
    const isHRAdmin =
      roles.includes("hr admin") || roles.includes("system admin");
    const isManager =
      roles.includes("department head") || roles.includes("department_head");
      
    const isEmployee = roles.includes("department employee");
    const isCandidate = roles.includes("job candidate");

    if (isHRAdmin) {
      router.replace("/dashboard/admin/leaves");
    } else if (isManager) {
      router.replace("/dashboard/manager/leaves");
    } else if (isEmployee) {
      router.replace("/dashboard/employee/leaves");
    } else if (isCandidate) {
      router.replace("/recruitment/my-applications");
    } else {
      // fallback
      router.replace("/home");
    }
  };

  // Logout: clear cookie in backend, then clear user
  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // ignore – we still clear local state
    }
    setUser(null);
    router.replace("/login");
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}