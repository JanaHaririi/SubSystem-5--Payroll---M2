// frontend/app/(system)/payroll-execution/components/DataTable.tsx
import React from "react";

type Column<T> = {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
};

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  emptyText = "No data",
}: {
  columns: Column<T>[];
  rows: T[];
  emptyText?: string;
}) {
  const getRowId = (row: T, index: number): string => {
    // Handle both MongoDB _id and standard id fields
    const id = (row as any)._id || (row as any).id || index;
    return String(id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((r, index) => {
              const rowId = getRowId(r, index);
              return (
                <tr key={rowId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  {columns.map((c) => (
                    <td key={`${rowId}-${c.key}`} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {c.render ? c.render(r) : (r as any)[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
