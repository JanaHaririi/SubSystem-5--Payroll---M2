"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axiosInstance, { registerUnauthenticatedHandler } from "@/app/utils/ApiClient";
import { usePathname, useRouter } from "next/navigation";

type User = {
  id?: string;
  role?: string;
  roles?: string[];
  name?: string;
  email: string;
  age?: number;
  userType?: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router= useRouter()
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchMe = async () => {
    try {
      const res = await axiosInstance.get<User>("/auth/me");
      setUser(res.data);
      console.log('fetch me',res)
    } catch {
      setUser(null); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []); // is it righ to refresh on changing user


 useEffect(() => {
  const handleUnauthenticated= () => {
    console.log('registering unauthorized handler')
    setUser(null);
    router.replace("/login");
    return
  };
  // Register this function with the axios file
  registerUnauthenticatedHandler(handleUnauthenticated);
}, [router]);


  // 2️⃣ Revalidate auth on every route change
  useEffect(() => {
    // pathname is undefined on very first render sometimes - just guard
    if (!pathname || pathname=='/login' || pathname=='/register' ) return;
    console.log("Route changed, revalidating /auth/me",pathname);
    // We do NOT touch `loading` here, to avoid global spinner flicker
    axiosInstance
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        // If cookie expired → /auth/me fails → user becomes null
        setUser(null);
        // optional: you *can* redirect here if you want auto-kick:
       router.replace("/login");
      });
  }, [pathname]); 

  // 2️⃣ Login: call Nest, it sets cookie, then refresh user
  const login = async (employeeNumber: string, password: string) => {
    await axiosInstance.post("/auth/login", { employeeNumber, password });
    await fetchMe(); // now /auth/me should return the logged-in user
  };



  // 3️⃣ Logout: clear cookie in backend, clear user in frontend
  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout"); // Nest should clear cookie
    } catch {
      // even if request fails, we clear UI state
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

// Nice hook so we don't repeat useContext(AuthContext) everywhere
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}