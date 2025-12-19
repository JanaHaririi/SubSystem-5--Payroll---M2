"use client";
import React, { useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useRouter } from "next/navigation";

interface PayGradeFormData {
  grade: string;
  baseSalary: number;
  grossSalary: number;
  status: "draft" | "approved" | "rejected";
}

export default function CreatePayGrade() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PayGradeFormData>({
    grade: "",
    baseSalary: 0,
    grossSalary: 0,
    status: "draft",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "baseSalary" || name === "grossSalary") {
      setForm((f) => ({ ...f, [name]: Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value } as any));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.grade.trim()) {
      setError("Grade name is required");
      return;
    }
    if (form.baseSalary < 6000) {
      setError("Base salary must be at least 6000");
      return;
    }
    if (form.grossSalary < 6000) {
      setError("Gross salary must be at least 6000");
      return;
    }
    if (form.grossSalary < form.baseSalary) {
      setError("Gross salary cannot be less than base salary");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await axiosInstance.post("/payroll-configuration/pay-grades", {
        grade: form.grade.trim(),
        baseSalary: form.baseSalary,
        grossSalary: form.grossSalary,
        status: form.status,
      });
      router.push("./");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create pay grade"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Create Pay Grade
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Define a new salary grade and compensation level for job positions
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg border border-red-300 dark:border-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grade Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Grade Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="grade"
            value={form.grade}
            onChange={handleChange}
            placeholder="e.g., Junior Developer, Senior Manager, etc."
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter the job grade or position title
          </p>
        </div>

        {/* Base Salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Base Salary <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-600 dark:text-gray-400">$</span>
            <input
              type="number"
              name="baseSalary"
              value={form.baseSalary || ""}
              onChange={handleChange}
              placeholder="0"
              min="6000"
              step="100"
              required
              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Minimum base salary is 6000
          </p>
        </div>

        {/* Gross Salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Gross Salary <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-600 dark:text-gray-400">$</span>
            <input
              type="number"
              name="grossSalary"
              value={form.grossSalary || ""}
              onChange={handleChange}
              placeholder="0"
              min="6000"
              step="100"
              required
              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Minimum gross salary is 6000. Must be greater than or equal to base salary
          </p>
        </div>

        {/* Salary Comparison Display */}
        {form.baseSalary > 0 && form.grossSalary > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">
              Difference: ${(form.grossSalary - form.baseSalary).toLocaleString()}
            </p>
          </div>
        )}

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
            Select the initial status for this pay grade
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
            onSubmit={handleSubmit}
          >
            {loading ? "Creating..." : "Create Pay Grade"}
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
