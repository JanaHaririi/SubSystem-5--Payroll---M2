"use client";

import { ReactNode, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import {
  isHRManager,
  isHREmployee,
  isLineManager,
  isEmployee,
} from "@/app/utils/roleCheck";
import {
  Home,
  FileText,
  Users,
  BarChart,
  AlertCircle,
  User as UserIcon,
  Menu,
  X,
  LogOut,
  ArrowLeft,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: ReactNode };

export default function PerformanceLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Move useMemo BEFORE early returns to maintain hook order
  const navItems: NavItem[] = useMemo(() => {
    if (!user) return [];

    const hrManager = isHRManager(user);
    const hrEmployee = isHREmployee(user); // includes HR Manager by design
    const lineManager = isLineManager(user);
    const employee = isEmployee(user);

    // HR nav (HR Employee/Manager)
    if (hrManager) {
      return [
        { href: "/performance/adminDashboard", label: "Dashboard", icon: <Home size={20} /> },
        { href: "/performance/templates", label: "Templates", icon: <FileText size={20} /> },
        { href: "/performance/cycles", label: "Cycles", icon: <Users size={20} /> },
        { href: "/performance/adminDisputes", label: "Disputes", icon: <AlertCircle size={20} /> },
        { href: "/performance/analytics", label: "Analytics", icon: <BarChart size={20} /> },
      ];
    }

    if (hrEmployee) {
      return [
        { href: "/performance/adminDashboard", label: "Dashboard", icon: <Home size={20} /> },
        { href: "/performance/cycles", label: "Cycles", icon: <Users size={20} /> },
        { href: "/performance/analytics", label: "Analytics", icon: <BarChart size={20} /> },
      ];
    }

    // Line manager nav
    if (lineManager) {
      return [
        { href: "/performance/assignments", label: "Evaluations", icon: <FileText size={20} /> },
      ];
    }

    // Regular employee nav
    if (employee) {
      return [
        { href: "/performance/employeeDashboard", label: "Dashboard", icon: <Home size={20} /> },
        { href: "/performance/reviews", label: "My Reviews", icon: <FileText size={20} /> },
        { href: "/performance/employeeDisputes", label: "My Disputes", icon: <AlertCircle size={20} /> },
      ];
    }

    return [];
  }, [user]);

  // Redirect if not authenticated
  if (!loading && !user) {
    router.push("/auth/login");
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const isActive = (path: string) => (pathname ? pathname.startsWith(path) : false);

  const userName = user?.email?.split("@")[0] || "User";

  // Safer label than user.roles[0] since your role structure varies
  const userRoleLabel =
    (isHREmployee(user) && "HR") ||
    (isLineManager(user) && "Manager") ||
    (isEmployee(user) && "Employee") ||
    "User";

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden mr-3 text-gray-300 hover:text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/performance" className="flex items-center space-x-2">
                <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-lg shadow-sm">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-semibold text-white hidden sm:inline">
                  Performance
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <Link
                href="/home"
                className="flex items-center space-x-2 px-3 py-2 rounded-full text-xs lg:text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </Link>

              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className="bg-gray-700 p-2 rounded-full">
                  <UserIcon size={16} className="text-gray-300" />
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">{userName}</p>
                  <p className="text-gray-400 text-xs">{userRoleLabel}</p>
                </div>
              </div>
              
                <LogOut size={16} />
                <span className="hidden md:inline">Logout</span>
              
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-700 py-3">
              <div className="flex flex-col space-y-2">
                <Link
                  href="/home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Home</span>
                </Link>

                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}

                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-700 p-2 rounded-full">
                      <UserIcon size={16} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{userName}</p>
                      <p className="text-gray-400 text-xs">{userRoleLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
