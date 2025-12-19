"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPolicyById, updatePolicy } from "@/app/utils/policiesApi";

const policyTypes = ["Deduction", "Allowance", "Benefit", "Misconduct", "Leave"];
const applicabilities = ["All Employees", "Full Time Employees", "Part Time Employees", "Contractors"];

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const id = params?.id || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await getPolicyById(id);
        // normalize date to YYYY-MM-DD
        data.effectiveDate = data.effectiveDate ? data.effectiveDate.slice(0,10) : new Date().toISOString().slice(0,10);
        setForm(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load policy");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("rule.")) {
      const key = name.split(".")[1];
      setForm((f: any) => ({ ...f, ruleDefinition: { ...f.ruleDefinition, [key]: Number(value) } }));
    } else if (name === "effectiveDate") {
      setForm((f: any) => ({ ...f, effectiveDate: value }));
    } else {
      setForm((f: any) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        policyName: form.policyName,
        policyType: form.policyType,
        description: form.description,
        effectiveDate: new Date(form.effectiveDate).toISOString(),
        ruleDefinition: form.ruleDefinition,
        applicability: form.applicability,
        status: form.status || 'draft',
      };
      await updatePolicy(id, payload);
      router.push("/payroll-configuration/config-policies");
    } catch (err: any) {
      if (form.status === 'approved' || form.status === 'rejected') {
        setError('You are not authorized to edit this policy');
      } else {
      setError(err?.response?.data?.message || err?.message || "Failed to save policy");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!form) return <div className="p-6 text-red-600">{error || 'Policy not found'}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Policy</h1>
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
          <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
