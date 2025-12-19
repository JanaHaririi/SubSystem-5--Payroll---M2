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

export default function CompanySettingsEditPage() {
  const [list, setList] = useState<Setting[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<Partial<Setting>>({
    payDate: "",
    timeZone: "",
    currency: "EGP",
    payCycle: "monthly",
  });
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    try {
      const res = await axiosInstance.get<Setting[]>("/payroll-configuration/company-settings");
      setList(res.data);
      if (res.data.length > 0 && !selectedId) {
        setSelectedId(res.data[0]._id);
        setForm({
          payDate: res.data[0].payDate,
          timeZone: res.data[0].timeZone,
          currency: res.data[0].currency,
          payCycle: res.data[0].payCycle,
        });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load settings");
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const found = list.find((i) => i._id === id);
    if (found) {
      setForm({
        payDate: found.payDate,
        timeZone: found.timeZone,
        currency: found.currency,
        payCycle: found.payCycle,
      });
      setStatusMsg(null);
      setError(null);
    }
  };

  const submit = async () => {
    if (!selectedId) {
      setError("Select a setting to edit.");
      return;
    }
    setLoading(true);
    setError(null);
    setStatusMsg(null);
    try {
      await axiosInstance.put(`/payroll-configuration/company-settings/${selectedId}`, form);
      setStatusMsg("Updated successfully.");
      fetchList();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Update failed (draft only).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Company-wide Settings</h1>
        <p className="text-sm text-gray-600">Select a draft entry to edit. System Admin role required.</p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>}
      {statusMsg && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700">{statusMsg}</div>}

      <div className="space-y-3 border rounded-lg p-4">
        <label className="text-sm text-gray-700">
          Select entry
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">-- choose --</option>
            {list.map((item) => (
              <option key={item._id} value={item._id}>
                {item.payDate} | {item.timeZone} | {item.currency} | {item.payCycle} | {item.status}
              </option>
            ))}
          </select>
        </label>

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
          className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </main>
  );
}
