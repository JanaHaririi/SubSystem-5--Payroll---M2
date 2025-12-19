"use client";
// frontend/app/(system)/payroll-execution/layout.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiHome, FiList, FiPlusCircle, FiTool, FiFileText } from "react-icons/fi";

export default function PayrollExecutionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const links = [
    { href: "/home", label: "Home", icon: <FiHome /> },
    { href: "/payroll-execution/runs", label: "Runs", icon: <FiList /> },
    { href: "/payroll-execution/runs/new", label: "Create Run", icon: <FiPlusCircle /> },
    { href: "/payroll-execution/pre-run", label: "Pre-Run (HR Events)", icon: <FiTool /> },
    { href: "/payroll-execution/payslips", label: "Payslips", icon: <FiFileText /> },
  ];

  return (
    //<div style={{ padding: 24 }}>
      
      <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#020618",
        color: "#e2e8f0",
        padding: 24,
      }}
       >
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Payroll Execution</h1>
      <nav
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
          borderBottom: "1px solid #1f2937",
          paddingBottom: 10,
        }}
      >
        {links.map(({ href, label, icon }) => {
          const isActive = mounted && (pathname === href || (href !== "/home" && pathname?.startsWith(href)));
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              style={{
                fontSize: 14,
                padding: "8px 12px",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: isActive ? "#0b1224" : "transparent",
                color: isActive ? "#e5e7eb" : "#cbd5e1",
                border: isActive ? "1px solid #2a3b5f" : "1px solid #23304d",
              }}
            >
              <span style={{ fontSize: 16, display: "flex" }}>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
