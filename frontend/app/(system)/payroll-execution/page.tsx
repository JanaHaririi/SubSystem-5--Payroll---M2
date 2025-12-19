// frontend/app/(system)/payroll-execution/page.tsx
import { redirect } from "next/navigation";

export default function PayrollExecutionHome() {
  redirect("/payroll-execution/runs");
}
