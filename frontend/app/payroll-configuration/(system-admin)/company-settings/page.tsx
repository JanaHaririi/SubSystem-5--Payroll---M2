"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";

type Setting = {
  _id: string;
  payDate: string;
  timeZone: string;
  currency: string;
  payCycle?: string;
  status?: string;
};

export default function CompanySettingsPage() {
  const [list, setList] = useState<Setting[]>([]);
  const [form, setForm] = useState<Partial<Setting>>({
    payDate: "",
    timeZone: "",
    currency: "EGP",
    payCycle: "monthly",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const fetchList = async () => {
    try {
      const res = await axiosInstance.get<Setting[]>("/payroll-configuration/company-settings");
      setList(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load settings");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post("/payroll-configuration/company-settings", form);
      setForm({ payDate: "", timeZone: "", currency: "EGP", payCycle: "monthly" });
      fetchList();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const runBackup = async () => {
    setBackupMsg(null);
    try {
      const res = await axiosInstance.get("/payroll-configuration/backup");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setBackupMsg("Backup downloaded.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Backup failed");
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Company-wide Settings</h1>
        <p className="text-sm text-gray-600">Create/edit settings (draft-only edit). System Admin role required.</p>
      </div>
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4">
        <label className="text-sm text-gray-700">
          Pay Date (ISO date)
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.payDate || ""}
            onChange={(e) => setForm({ ...form, payDate: e.target.value })}
            placeholder="2025-12-01"
          />
        </label>
        <label className="text-sm text-gray-700">
          Time Zone
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.timeZone || ""}
            onChange={(e) => setForm({ ...form, timeZone: e.target.value })}
            placeholder="Africa/Cairo"
          />
        </label>
        <label className="text-sm text-gray-700">
          Currency
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.currency || ""}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            placeholder="EGP"
          />
        </label>
        <label className="text-sm text-gray-700">
          Pay Cycle
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.payCycle || ""}
            onChange={(e) => setForm({ ...form, payCycle: e.target.value })}
            placeholder="monthly"
          />
        </label>
        <button
          onClick={submit}
          disabled={loading}
          className="md:col-span-2 rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Create draft"}
        </button>
        <button
          onClick={runBackup}
          className="md:col-span-2 rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Run Backup (download JSON)
        </button>
      </div>

      {backupMsg && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700">{backupMsg}</div>}

      <div className="border rounded-lg">
        <div className="border-b px-4 py-2 font-semibold">Existing</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2">Pay Date</th>
              <th>Time Zone</th>
              <th>Currency</th>
              <th>Cycle</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item._id} className="border-b">
                <td className="px-4 py-2">{item.payDate}</td>
                <td>{item.timeZone}</td>
                <td>{item.currency}</td>
                <td>{item.payCycle}</td>
                <td>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize">{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}