"use client";
import React, { useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useRouter } from "next/navigation";

interface SigningBonusFormData {
  positionName: string;
  amount: number;
  status: "draft" | "approved" | "rejected";
}

export default function CreateSigningBonus() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SigningBonusFormData>({
    positionName: "",
    amount: 0,
    status: "draft",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "amount") {
      setForm((f) => ({ ...f, [name]: Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value } as any));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.positionName.trim()) {
      setError("Position name is required");
      return;
    }
    if (form.amount < 0) {
      setError("Amount cannot be negative");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await axiosInstance.post("/payroll-configuration/signing-bonuses", {
        positionName: form.positionName.trim(),
        amount: form.amount,
        status: form.status,
      });
      router.push("./");
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message || err?.response?.data || null;
      const message = serverMessage
        ? `Request failed (${status}): ${JSON.stringify(serverMessage)}`
        : (err?.message || "Failed to create signing bonus");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Create Signing Bonus
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add a new signing bonus policy based on position (e.g., Junior TA, Mid TA, Senior TA)
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg border border-red-300 dark:border-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Position Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Position Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="positionName"
            value={form.positionName}
            onChange={handleChange}
            placeholder="e.g., Junior Developer, Senior Engineer, etc."
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter the position name this signing bonus applies to
          </p>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-600 dark:text-gray-400">$</span>
            <input
              type="number"
              name="amount"
              value={form.amount || ""}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="100"
              required
              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter the signing bonus amount for this position
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select the initial status for this signing bonus
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating..." : "Create Signing Bonus"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

