// frontend/app/(system)/payroll-execution/components/StatusChip.tsx
export default function StatusChip({ value }: { value: string }) {
  const v = (value || "").toLowerCase();

  const style: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-block",
  };

  if (v.includes("approved") || v.includes("paid") || v.includes("active")) {
    return <span style={{ ...style, background: "#dcfce7", color: "#166534" }}>{value}</span>;
  }
  if (v.includes("pending") || v.includes("review") || v.includes("draft")) {
    return <span style={{ ...style, background: "#fef3c7", color: "#b45309" }}>{value}</span>;
  }
  if (v.includes("rejected") || v.includes("invalid")) {
    return <span style={{ ...style, background: "#fee2e2", color: "#991b1b" }}>{value}</span>;
  }
  return <span style={{ ...style, background: "#dbeafe", color: "#1e3a8a" }}>{value}</span>;
}
