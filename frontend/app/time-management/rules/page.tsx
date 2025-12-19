"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";

export interface ScheduleRule {
  _id?: string;
  name: string;
  pattern: string;
  active?: boolean;
}

export interface OvertimeRule {
  _id?: string;
  name: string;
  description?: string;
  active?: boolean;
  approved?: boolean;
}

export interface LatenessRule {
  _id?: string;
  name: string;
  description?: string;
  gracePeriodMinutes?: number;
  deductionForEachMinute?: number;
  active?: boolean;
}

type RuleType = "schedule" | "overtime" | "lateness";

export default function Rules() {
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([]);
  const [overtimeRules, setOvertimeRules] = useState<OvertimeRule[]>([]);
  const [latenessRules, setLatenessRules] = useState<LatenessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RuleType>("schedule");
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const { user } = useAuth();
  const isHRManager = user?.roles?.includes("HR Manager");
  const isHRAdmin = user?.roles?.includes("HR Manager");
  const isEmployee = user?.roles?.includes("Employee");
  const isPayroll = user?.roles?.includes("Payroll");
  const isHR = isHRManager || isHRAdmin 
  const canRead = isEmployee || isPayroll

  // --- Form States ---
  const [newScheduleRule, setNewScheduleRule] = useState<ScheduleRule>({ name: "", pattern: "", active: true });
  const [newOvertimeRule, setNewOvertimeRule] = useState<OvertimeRule>({ name: "", description: "", active: true, approved: false });
  const [newLatenessRule, setNewLatenessRule] = useState<LatenessRule>({ name: "", description: "", gracePeriodMinutes: 0, deductionForEachMinute: 0, active: true });

  // --- Fetch Rules (KEEP EXACTLY AS BEFORE) ---
  const fetchScheduleRules = async () => {
    try {
      const res = await axios.get<{ data: { success: boolean; data: ScheduleRule[] } }>(
        "http://localhost:4000/time-management/schedule-rule",
        { withCredentials: true }
      );
      setScheduleRules(res.data.data.data || []);
    } catch (err) {
      console.error("Error fetching schedule rules:", err);
    }
  };

  const fetchOvertimeRules = async () => {
    try {
      const res = await axios.get("http://localhost:4000/time-management/overtime-rule", { withCredentials: true });
      setOvertimeRules(res.data.data || []);
    } catch (err) {
      console.error("Error fetching overtime rules:", err);
    }
  };

  const fetchLatenessRules = async () => {
    try {
      const res = await axios.get("http://localhost:4000/time-management/lateness-rule", { withCredentials: true });
      setLatenessRules(res.data || []);
    } catch (err) {
      console.error("Error fetching lateness rules:", err);
    }
  };

  const fetchAllRules = async () => {
    setLoading(true);
    await Promise.all([fetchScheduleRules(), fetchOvertimeRules(), fetchLatenessRules()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllRules();
  }, []);

  // --- Submit Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (activeTab === "schedule") {
      const { _id, ...dto } = newScheduleRule;

      if (editingRule?._id) {
        await axios.patch(
          `http://localhost:4000/time-management/schedule-rule/${editingRule._id}`,
          dto,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          "http://localhost:4000/time-management/schedule-rule",
          dto,
          { withCredentials: true }
        );
      }
    }

    if (activeTab === "overtime") {
      const { _id, ...dto } = newOvertimeRule;

      if (editingRule?._id) {
        await axios.patch(
          `http://localhost:4000/time-management/overtime-rule/${editingRule._id}`,
          dto,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          "http://localhost:4000/time-management/overtime-rule",
          dto,
          { withCredentials: true }
        );
      }
    }

    if (activeTab === "lateness") {
      const { _id, ...dto } = newLatenessRule;

      if (editingRule?._id) {
        await axios.patch(
          `http://localhost:4000/time-management/lateness-rule/${editingRule._id}`,
          dto,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          "http://localhost:4000/time-management/lateness-rule",
          dto,
          { withCredentials: true }
        );
      }
    }

    await fetchAllRules();
    resetForm();
  } catch (err) {
    console.error("Submit error:", err);
  }
};


  // --- Delete Handler ---
  const deleteRule = async (id: string, type: RuleType) => {
    if (!isHR) return;
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:4000/time-management/${type}-rule/${id}`, { withCredentials: true });
      await fetchAllRules();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Reset Form ---
  const resetForm = () => {
    setShowForm(false);
    setEditingRule(null);
    setNewScheduleRule({ name: "", pattern: "", active: true });
    setNewOvertimeRule({ name: "", description: "", active: true, approved: false });
    setNewLatenessRule({ name: "", description: "", gracePeriodMinutes: 0, deductionForEachMinute: 0, active: true });
  };

  // --- Edit Handler ---
  const editRule = (rule: any, type: RuleType) => {
    if (!isHR) return;
    setEditingRule(rule);
    setActiveTab(type);
    if (type === "schedule") setNewScheduleRule(rule);
    if (type === "overtime") setNewOvertimeRule(rule);
    if (type === "lateness") setNewLatenessRule(rule);
    setShowForm(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const currentRules = activeTab === "schedule" ? scheduleRules : activeTab === "overtime" ? overtimeRules : latenessRules;

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 flex flex-col items-center">
      <div className="w-full max-w-6xl flex justify-between mb-4">
        <Link href="/time-management/" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
        {isHR && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Rule
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg w-full max-w-6xl">
        {["schedule","overtime","lateness"].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as RuleType); resetForm(); }}
            className={`flex-1 py-2 px-4 rounded font-medium ${activeTab===tab?"bg-white dark:bg-gray-800 shadow":"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
          >
            {tab.charAt(0).toUpperCase()+tab.slice(1)} Rules
          </button>
        ))}
      </div>

      {/* Modal */}
{showForm && isHR && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
      <button onClick={resetForm} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-lg font-bold">&times;</button>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {editingRule ? "Edit" : "Add"} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Rule
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "schedule" && <>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input required type="text" placeholder="Rule Name" value={newScheduleRule.name} onChange={e=>setNewScheduleRule({...newScheduleRule,name:e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded"/>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Pattern</label>
            <input required type="text" placeholder="Schedule Pattern" value={newScheduleRule.pattern} onChange={e=>setNewScheduleRule({...newScheduleRule,pattern:e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded"/>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={newScheduleRule.active} onChange={e=>setNewScheduleRule({...newScheduleRule,active:e.target.checked})}/>
            <span>Active</span>
          </div>
        </>}

        {activeTab === "overtime" && <>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input required type="text" placeholder="Rule Name" value={newOvertimeRule.name} onChange={e=>setNewOvertimeRule({...newOvertimeRule,name:e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded"/>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input type="text" placeholder="Optional Description" value={newOvertimeRule.description} onChange={e=>setNewOvertimeRule({...newOvertimeRule,description:e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded"/>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={newOvertimeRule.active} onChange={e=>setNewOvertimeRule({...newOvertimeRule,active:e.target.checked})}/>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={newOvertimeRule.approved} onChange={e=>setNewOvertimeRule({...newOvertimeRule,approved:e.target.checked})}/>
              <span>Approved</span>
            </div>
          </div>
        </>}

        {activeTab === "lateness" && <>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input required type="text" placeholder="Rule Name" value={newLatenessRule.name} onChange={e=>setNewLatenessRule({...newLatenessRule,name:e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded"/>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input type="text" placeholder="Optional Description" value={newLatenessRule.description} onChange={e=>setNewLatenessRule({...newLatenessRule,description:e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded"/>
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Grace Period (minutes)</label>
              <input type="number" min={0} value={newLatenessRule.gracePeriodMinutes} onChange={e=>setNewLatenessRule({...newLatenessRule,gracePeriodMinutes:Number(e.target.value)})} className="w-full p-2 border dark:border-gray-700 rounded"/>
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Deduction per Minute</label>
              <input type="number" min={0} value={newLatenessRule.deductionForEachMinute} onChange={e=>setNewLatenessRule({...newLatenessRule,deductionForEachMinute:Number(e.target.value)})} className="w-full p-2 border dark:border-gray-700 rounded"/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={newLatenessRule.active} onChange={e=>setNewLatenessRule({...newLatenessRule,active:e.target.checked})}/>
            <span>Active</span>
          </div>
        </>}

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingRule ? "Update" : "Create"}</button>
      </form>
    </div>
  </div>
)}

      {/* Rules List */}
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
        {currentRules.map(rule=>(
          <div key={rule._id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
              {'description' in rule && rule.description && <p className="text-gray-600 dark:text-gray-400 text-sm">{rule.description}</p>}
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {'pattern' in rule && <span>Pattern: {(rule as ScheduleRule).pattern}</span>}
                {'approved' in rule && <span>Approved: {(rule as OvertimeRule).approved ? "Yes" : "No"}</span>}
                {'gracePeriodMinutes' in rule && <span>Grace: {(rule as LatenessRule).gracePeriodMinutes} min</span>}
                {'deductionForEachMinute' in rule && <span>Deduction: ${(rule as LatenessRule).deductionForEachMinute}/min</span>}
                <span className={`px-2 py-1 rounded ${rule.active?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{rule.active?'Active':'Inactive'}</span>
              </div>
            </div>
            {isHR && (
              <div className="flex space-x-2">
                <button onClick={()=>editRule(rule, activeTab)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Edit</button>
                <button onClick={()=>deleteRule(rule._id!, activeTab)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
              </div>
            )}
          </div>
        ))}
        {currentRules.length===0 && <p className="text-gray-600 dark:text-gray-400 text-center py-8">No {activeTab} rules found.</p>}
      </div>
    </div>
  );
}
