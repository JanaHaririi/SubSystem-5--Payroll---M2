"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";

type TaxDoc = { _id: string; employeeId: string; year: number; downloadUrl: string };

export default function TaxDocumentsPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear] = useState<number>(2025);
  const [url, setUrl] = useState("");
  const [list, setList] = useState<TaxDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = async () => {
    if (!employeeId) return;
    try {
      const res = await axiosInstance.get<TaxDoc[]>(`/payroll-configuration/tax-documents/${employeeId}`);
      setList(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load tax documents");
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    setError(null);
    try {
      await axiosInstance.post("/payroll-configuration/tax-documents", {
        employeeId,
        year,
        downloadUrl: url,
      });
      fetchDocs();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create");
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tax Documents</h1>
        <p className="text-sm text-gray-600">Managers can create; employees can list/download via their ID.</p>
      </div>
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border rounded-lg p-4">
        <input
          className="rounded border px-3 py-2"
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Year"
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Download URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="md:col-span-3 flex gap-3">
          <button onClick={create} className="rounded bg-blue-600 text-white px-4 py-2">
            Create
          </button>
          <button onClick={fetchDocs} className="rounded border px-4 py-2">
            Refresh
          </button>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="border-b px-4 py-2 font-semibold">Documents</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2">Employee</th>
              <th>Year</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d._id} className="border-b">
                <td className="px-4 py-2">{d.employeeId}</td>
                <td>{d.year}</td>
                <td>
                  <a className="text-blue-600 underline" href={d.downloadUrl} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}


