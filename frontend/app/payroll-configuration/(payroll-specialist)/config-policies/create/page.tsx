"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createPolicy, CreatePolicyPayload } from "@/app/utils/policiesApi";

const policyTypes = ["Deduction", "Allowance", "Benefit", "Misconduct", "Leave"];
const applicabilities = ["All Employees", "Full Time Employees", "Part Time Employees", "Contractors"];

export default function CreatePolicyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePolicyPayload>({
    policyName: "",
    policyType: "Allowance",
    description: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    ruleDefinition: { percentage: 0, fixedAmount: 0, thresholdAmount: 0 },
    applicability: "All Employees",
    status: "draft",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("rule.")) {
      const key = name.split(".")[1];
      setForm((f) => ({ ...f, ruleDefinition: { ...f.ruleDefinition, [key]: Number(value) } }));
    } else if (name === "effectiveDate") {
      setForm((f) => ({ ...f, effectiveDate: value }));
    } else if (name === "policyName" || name === "policyType" || name === "description" || name === "applicability") {
      setForm((f) => ({ ...f, [name]: value } as any));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createPolicy(form);
      router.push('./');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to create policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Policy</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Policy Name</label>
          <input name="policyName" value={form.policyName} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Policy Type</label>
            <select name="policyType" value={form.policyType} onChange={handleChange} className="w-full p-2 border rounded">
              {policyTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Applicability</label>
            <select name="applicability" value={form.applicability} onChange={handleChange} className="w-full p-2 border rounded">
              {applicabilities.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full p-2 border rounded" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Effective Date</label>
            <input name="effectiveDate" type="date" value={form.effectiveDate.slice(0,10)} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Percentage (%)</label>
            <input name="rule.percentage" type="number" value={String(form.ruleDefinition.percentage)} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fixed Amount</label>
            <input name="rule.fixedAmount" type="number" value={String(form.ruleDefinition.fixedAmount)} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Threshold Amount</label>
          <input name="rule.thresholdAmount" type="number" value={String(form.ruleDefinition.thresholdAmount)} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Creating...' : 'Create'}</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
