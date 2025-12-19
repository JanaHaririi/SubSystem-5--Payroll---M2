"use client";
// frontend/app/(system)/payroll-execution/layout.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PayrollExecutionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // const links = [
  //   { href: "/home", label: "Home" },
  //   { href: "/payroll-execution/runs", label: "Runs" },
  //   { href: "/payroll-execution/runs/new", label: "Create Run" },
  //   { href: "/payroll-execution/pre-run", label: "Pre-Run (HR Events)" },
  //   { href: "/payroll-execution/payslips", label: "Payslips" },
  // ];

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
      {/* <nav
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 8,
        }}
      >
        {links.map(({ href, label }) => {
          const isActive = mounted && (pathname === href || (href !== "/home" && pathname?.startsWith(href)));
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              style={{
                fontSize: 14,
                padding: "6px 10px",
                borderRadius: 6,
                textDecoration: isActive ? "none" : "none",
                background: isActive ? "#f3f4f6" : "transparent",
                color: isActive ? "#111827" : "#374151",
                border: isActive ? "1px solid #e5e7eb" : "1px solid transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav> */}

      <div>{children}</div>
    </div>
  );
}
