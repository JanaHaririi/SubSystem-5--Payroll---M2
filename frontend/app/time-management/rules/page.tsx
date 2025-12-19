"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import { FaCalendarAlt, FaClock, FaMoneyBillWave, FaEdit, FaTrash, FaPlus, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaCalendarCheck, FaHourglassHalf, FaExclamationTriangle } from "react-icons/fa";

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

  // --- Fetch Rules ---
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
    if (!confirm("Are you sure you want to delete this rule?")) return;
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

  const getTabIcon = (tab: RuleType) => {
    switch (tab) {
      case "schedule": return <FaCalendarAlt className="text-lg" />;
      case "overtime": return <FaClock className="text-lg" />;
      case "lateness": return <FaExclamationTriangle className="text-lg" />;
      default: return null;
    }
  };

  const getTabColor = (tab: RuleType) => {
    switch (tab) {
      case "schedule": return "from-blue-500 to-cyan-500";
      case "overtime": return "from-amber-500 to-orange-500";
      case "lateness": return "from-rose-500 to-pink-500";
      default: return "from-gray-500 to-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-blue-500/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
            Loading rules configuration...
          </p>
        </div>
      </div>
    );
  }

  const currentRules = activeTab === "schedule" ? scheduleRules : activeTab === "overtime" ? overtimeRules : latenessRules;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FaCalendarCheck className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Rules Configuration
                  </h1>
                  <p className="text-white/80 text-sm md:text-base">
                    Manage and configure time management rules
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link 
                  href="/time-management" 
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                >
                  <FaArrowLeft className="text-sm" />
                  Back to Dashboard
                </Link>
                {isHR && (
                  <button 
                    onClick={() => setShowForm(true)} 
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <FaPlus />
                    Add Rule
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              {(["schedule", "overtime", "lateness"] as RuleType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); resetForm(); }}
                  className={`flex items-center gap-3 px-6 py-4 font-medium text-sm transition-all relative ${activeTab === tab 
                    ? `text-${tab === 'schedule' ? 'blue' : tab === 'overtime' ? 'amber' : 'rose'}-600 dark:text-${tab === 'schedule' ? 'blue' : tab === 'overtime' ? 'amber' : 'rose'}-400`
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === tab 
                    ? `bg-${tab === 'schedule' ? 'blue' : tab === 'overtime' ? 'amber' : 'rose'}-100 dark:bg-${tab === 'schedule' ? 'blue' : tab === 'overtime' ? 'amber' : 'rose'}-900/30`
                    : 'bg-gray-100 dark:bg-gray-900'
                  }`}>
                    {getTabIcon(tab)}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{tab.charAt(0).toUpperCase() + tab.slice(1)} Rules</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tab === "schedule" && scheduleRules.length + " rules"}
                      {tab === "overtime" && overtimeRules.length + " rules"}
                      {tab === "lateness" && latenessRules.length + " rules"}
                    </span>
                  </div>
                  {activeTab === tab && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${getTabColor(tab)}`}></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rules List */}
          <div className="p-6">
            {currentRules.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <FaCalendarCheck className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No {activeTab} rules found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {activeTab === "schedule" && "No schedule rules have been configured yet."}
                  {activeTab === "overtime" && "No overtime rules have been configured yet."}
                  {activeTab === "lateness" && "No lateness rules have been configured yet."}
                </p>
                {isHR && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <FaPlus />
                    Add Your First Rule
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentRules.map(rule => (
                  <div 
                    key={rule._id} 
                    className="group bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {rule.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${rule.active 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          } flex items-center gap-1.5`}>
                            {rule.active ? <FaCheckCircle className="text-xs" /> : <FaTimesCircle className="text-xs" />}
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {'description' in rule && rule.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {rule.description}
                          </p>
                        )}

                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="space-y-2">
                            {'pattern' in rule && (
                              <div className="flex items-center gap-2 text-sm">
                                <FaCalendarAlt className="text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  <strong className="font-medium text-gray-800 dark:text-gray-200">Pattern:</strong> {(rule as ScheduleRule).pattern}
                                </span>
                              </div>
                            )}
                            
                            {'approved' in rule && (
                              <div className="flex items-center gap-2 text-sm">
                                <FaCheckCircle className={`${(rule as OvertimeRule).approved ? 'text-emerald-400' : 'text-amber-400'}`} />
                                <span className="text-gray-700 dark:text-gray-300">
                                  <strong className="font-medium text-gray-800 dark:text-gray-200">Approved:</strong> {(rule as OvertimeRule).approved ? "Yes" : "No"}
                                </span>
                              </div>
                            )}
                            
                            {'gracePeriodMinutes' in rule && (
                              <div className="flex items-center gap-2 text-sm">
                                <FaClock className="text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  <strong className="font-medium text-gray-800 dark:text-gray-200">Grace Period:</strong> {(rule as LatenessRule).gracePeriodMinutes} minutes
                                </span>
                              </div>
                            )}
                            
                            {'deductionForEachMinute' in rule && (
                              <div className="flex items-center gap-2 text-sm">
                                <FaMoneyBillWave className="text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  <strong className="font-medium text-gray-800 dark:text-gray-200">Deduction:</strong> ${(rule as LatenessRule).deductionForEachMinute}/minute
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isHR && (
                        <div className="flex flex-col gap-2 ml-4">
                          <button 
                            onClick={() => editRule(rule, activeTab)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                            title="Edit Rule"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button 
                            onClick={() => deleteRule(rule._id!, activeTab)}
                            className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                            title="Delete Rule"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && isHR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
            onClick={resetForm}
          />
          
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingRule ? "✏️ Edit" : "➕ Add"} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Rule
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {editingRule ? "Update the rule details" : "Configure a new rule"}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimesCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === "schedule" && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Rule Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter rule name"
                        value={newScheduleRule.name}
                        onChange={e => setNewScheduleRule({...newScheduleRule, name: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Schedule Pattern
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter schedule pattern"
                        value={newScheduleRule.pattern}
                        onChange={e => setNewScheduleRule({...newScheduleRule, pattern: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="activeSchedule"
                        checked={newScheduleRule.active}
                        onChange={e => setNewScheduleRule({...newScheduleRule, active: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <label htmlFor="activeSchedule" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Active Rule
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "overtime" && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Rule Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter rule name"
                        value={newOvertimeRule.name}
                        onChange={e => setNewOvertimeRule({...newOvertimeRule, name: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter description"
                        value={newOvertimeRule.description}
                        onChange={e => setNewOvertimeRule({...newOvertimeRule, description: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="activeOvertime"
                          checked={newOvertimeRule.active}
                          onChange={e => setNewOvertimeRule({...newOvertimeRule, active: e.target.checked})}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <label htmlFor="activeOvertime" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Active
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="approvedOvertime"
                          checked={newOvertimeRule.approved}
                          onChange={e => setNewOvertimeRule({...newOvertimeRule, approved: e.target.checked})}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <label htmlFor="approvedOvertime" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Approved
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "lateness" && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Rule Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter rule name"
                        value={newLatenessRule.name}
                        onChange={e => setNewLatenessRule({...newLatenessRule, name: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter description"
                        value={newLatenessRule.description}
                        onChange={e => setNewLatenessRule({...newLatenessRule, description: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Grace Period (minutes)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newLatenessRule.gracePeriodMinutes}
                          onChange={e => setNewLatenessRule({...newLatenessRule, gracePeriodMinutes: Number(e.target.value)})}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Deduction per Minute
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={newLatenessRule.deductionForEachMinute}
                          onChange={e => setNewLatenessRule({...newLatenessRule, deductionForEachMinute: Number(e.target.value)})}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="activeLateness"
                        checked={newLatenessRule.active}
                        onChange={e => setNewLatenessRule({...newLatenessRule, active: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <label htmlFor="activeLateness" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Active Rule
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  {editingRule ? "Update Rule" : "Create Rule"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-gray-500 to-gray-400 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}