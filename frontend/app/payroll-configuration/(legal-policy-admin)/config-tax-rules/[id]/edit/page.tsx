"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTaxRuleById, updateTaxRule, EditTaxRulePayload } from "@/app/utils/taxRulesApi";

const statusOptions = ["draft", "approved", "rejected"];

export default function EditTaxRulePage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const id = params?.id || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditTaxRulePayload & { name: string; rate: number } | null>(
    null
  );

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await getTaxRuleById(id);
        setForm({
          name: data.name || "",
          description: data.description || "",
          rate: data.rate || 0,
          status: data.status || "draft",
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load tax rule");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "rate") {
      setForm((f: any) => ({ ...f, [name]: Number(value) }));
    } else {
      setForm((f: any) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setError(null);

    // Validation
    if (!form.name?.trim()) {
      setError("Tax rule name is required");
      return;
    }
    if (form.rate !== undefined && form.rate < 0) {
      setError("Tax rate must be 0 or greater");
      return;
    }

    setSaving(true);
    try {
      const payload: EditTaxRulePayload = {
        name: form.name,
        description: form.description,
        rate: form.rate,
        status: form.status,
      };
      await updateTaxRule(id, payload);
      alert("Tax rule updated successfully");
      router.push("../../");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save tax rule");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading tax rule...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400">
        {error || "Tax rule not found"}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">
        Update Tax Rule & Law
      </h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Tax Rule Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Income Tax, VAT, Corporate Tax"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide a detailed description of this tax rule or law..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Tax Rate (%) <span className="text-red-500">*</span>
            </label>
            <input
              name="rate"
              type="number"
              min="0"
              step="0.01"
              value={form.rate}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the tax rate as a percentage (e.g., 15 for 15%)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={form.status || "draft"}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

