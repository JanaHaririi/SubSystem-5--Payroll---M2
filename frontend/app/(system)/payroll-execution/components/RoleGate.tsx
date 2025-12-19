// frontend/app/(system)/payroll-execution/components/RoleGate.tsx
"use client";

import { useAuth } from "@/app/(system)/context/authContext";

export default function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useAuth();
  
  // Check if user has any of the allowed roles
  const hasRole = user?.roles?.some(role => allow.includes(role));
  
  if (!hasRole) return fallback;
  return <>{children}</>;
}
