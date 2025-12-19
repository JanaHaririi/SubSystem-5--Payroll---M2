"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/(system)/context/authContext";

interface SidebarProps {
  role?: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems: Record<string, { name: string; href: string }[]> = {
    admin: [
      { name: "Leaves", href: "/dashboard/admin/leaves" },
      { name: "Policies", href: "/dashboard/admin/leaves/policies" },
      { name: "Entitlements", href: "/dashboard/admin/leaves/entitlements" },
      { name: "Requests", href: "/dashboard/admin/leaves/requests" },
    ],
    manager: [
      { name: "Requests", href: "/dashboard/manager/requests" },
    ],
    employee: [
      { name: "My Balance", href: "/dashboard/employee/my-balance" },
      { name: "My Requests", href: "/dashboard/employee/my-requests" },
      { name: "New Request", href: "/dashboard/employee/new-request" },
    ],
  };

  const items = menuItems[role || "employee"] || [];

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
      <div className="text-2xl font-semibold mb-6">HR Portal</div>

      <nav className="flex-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md mb-1 transition ${
              pathname === item.href
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <footer className="text-sm text-gray-400 mt-auto border-t border-gray-700 pt-3">
        {user?.email}
      </footer>
    </aside>
  );
}
