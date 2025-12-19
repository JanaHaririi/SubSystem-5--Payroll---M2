"use client";

import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  // Role-based menu control
  const roles = user?.roles?.map((r) => r.toLowerCase()) || [];
  const isAdmin = roles.includes("hr admin") || roles.includes("system admin");

  const navLinks = [
    { href: "/home", label: "Dashboard", visible: true },
    { href: "/leaves/my-balance", label: "My Leave Balance", visible: true },
    { href: "/leaves/my-requests", label: "My Requests", visible: true },
    { href: "/leaves/admin/policies", label: "Leave Policies", visible: isAdmin },
    { href: "/leaves/admin/categories", label: "Categories", visible: isAdmin },
    { href: "/profile", label: "My Profile", visible: true },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 p-5 flex flex-col justify-between shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">
            HR Management
          </h2>
          <nav className="space-y-2">
            {navLinks
              .filter((link) => link.visible)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>

        <button
          onClick={logout}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-md"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
