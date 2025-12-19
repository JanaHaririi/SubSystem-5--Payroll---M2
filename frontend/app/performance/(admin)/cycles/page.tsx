'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { AppraisalCycle, AppraisalCycleStatus } from '@/app/types/performance';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart,
  Copy,
  Edit,
  Eye,
} from 'lucide-react';

export default function CyclesPage() {
  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [filteredCycles, setFilteredCycles] = useState<AppraisalCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    filterCycles();
  }, [searchTerm, statusFilter, cycles]);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const data = await performanceApi.getAllAppraisalCycles();
      setCycles(data);
      setFilteredCycles(data);
    } finally {
      setLoading(false);
    }
  };

  const filterCycles = () => {
    let filtered = [...cycles];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cycle =>
        cycle.name.toLowerCase().includes(term) ||
        cycle.description?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(cycle => cycle.status === statusFilter);
    }

    setFilteredCycles(filtered);
  };

  const getStatusBadge = (status: AppraisalCycleStatus) => {
    switch (status) {
      case AppraisalCycleStatus.ACTIVE:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-900/30 text-green-400 rounded-full flex items-center gap-1">
            <Play className="h-3 w-3" />
            Active
          </span>
        );
      case AppraisalCycleStatus.PLANNED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-900/30 text-blue-400 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Planned
          </span>
        );
      case AppraisalCycleStatus.CLOSED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Closed
          </span>
        );
      case AppraisalCycleStatus.ARCHIVED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-800 text-gray-400 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Archived
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Appraisal Cycles</h1>
          <p className="text-gray-400 mt-1">
            Create and manage performance appraisal cycles
          </p>
        </div>

        <Link href="/performance/cycles/create">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} />
            Create Cycle
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="bg-black border border-neutral-700 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{cycles.length}</p>
            <p className="text-sm text-gray-400">Total Cycles</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">
              {cycles.filter(c => c.status === AppraisalCycleStatus.ACTIVE).length}
            </p>
            <p className="text-sm text-gray-400">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">
              {cycles.filter(c => c.status === AppraisalCycleStatus.PLANNED).length}
            </p>
            <p className="text-sm text-gray-400">Planned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-400">
              {cycles.filter(c => c.status === AppraisalCycleStatus.ARCHIVED).length}
            </p>
            <p className="text-sm text-gray-400">Archived</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-black border border-neutral-700 rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cycles..."
              className="w-full pl-10 pr-3 py-2 rounded-md bg-neutral-900 text-white placeholder-gray-400 border border-neutral-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 text-white border border-neutral-700 rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value={AppraisalCycleStatus.PLANNED}>Planned</option>
              <option value={AppraisalCycleStatus.ACTIVE}>Active</option>
              <option value={AppraisalCycleStatus.CLOSED}>Closed</option>
              <option value={AppraisalCycleStatus.ARCHIVED}>Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cycles */}
      <div className="space-y-4">
        {filteredCycles.map(cycle => (
          <div key={cycle._id} className="bg-black border border-neutral-700 rounded-lg p-6">
            <div className="flex justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{cycle.name}</h3>
                <div className="flex gap-2 mt-1">
                  {getStatusBadge(cycle.status)}
                  <span className="px-2 py-1 text-xs bg-purple-900/30 text-purple-400 rounded-full">
                    {cycle.cycleType}
                  </span>
                </div>

                {cycle.description && (
                  <p className="text-sm text-gray-400 mt-2">
                    {cycle.description}
                  </p>
                )}

                <div className="flex gap-6 mt-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(cycle.startDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(cycle.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    Templates: {cycle.templateAssignments?.length || 0}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link href={`/performance/cycles/${cycle._id}/assignments`}>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                    <Users size={14} />
                    Assignments
                  </button>
                </Link>

                <div className="flex gap-2">
                  <Link href={`/performance/cycles/view/${cycle._id}`}>
                    <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-neutral-800 rounded-md">
                      <Eye size={16} />
                    </button>
                  </Link>
                  <Link href={`/performance/cycles/edit/${cycle._id}`}>
                    <button className="p-2 text-gray-400 hover:text-green-400 hover:bg-neutral-800 rounded-md">
                      <Edit size={16} />
                    </button>
                  </Link>
                  <button className="p-2 text-gray-400 hover:text-purple-400 hover:bg-neutral-800 rounded-md">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-700 mt-4 pt-4">
              <Link href={`/performance/analytics?cycleId=${cycle._id}`}>
                <button className="px-3 py-1 border border-neutral-700 text-gray-300 rounded-md hover:bg-neutral-800 flex items-center gap-1">
                  <BarChart size={12} />
                  Analytics
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
