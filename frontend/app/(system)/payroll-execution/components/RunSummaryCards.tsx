// frontend/app/(system)/payroll-execution/components/RunSummaryCards.tsx
export default function RunSummaryCards({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
      {items.map((it) => (
        <div key={it.label} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow hover:shadow-md transition">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">{it.label}</div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-2">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
