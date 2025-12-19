// app/performance/cycles/page.tsx
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
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart,
  Copy,
  Edit,
  Eye,
  Trash2
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
    } catch (error) {
      console.error('Error fetching cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCycles = () => {
    let filtered = [...cycles];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cycle =>
        cycle.name.toLowerCase().includes(term) ||
        cycle.description?.toLowerCase().includes(term) ||
        cycle.cycleType.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cycle => cycle.status === statusFilter);
    }

    setFilteredCycles(filtered);
  };

  const getStatusBadge = (status: AppraisalCycleStatus) => {
    switch (status) {
      case AppraisalCycleStatus.ACTIVE:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
            <Play className="h-3 w-3" />
            Active
          </span>
        );
      case AppraisalCycleStatus.PLANNED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Planned
          </span>
        );
      case AppraisalCycleStatus.CLOSED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Closed
          </span>
        );
      case AppraisalCycleStatus.ARCHIVED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getCycleTypeLabel = (type: string) => {
    switch (type) {
      case 'ANNUAL': return 'Annual';
      case 'SEMI_ANNUAL': return 'Semi-Annual';
      case 'PROBATIONARY': return 'Probationary';
      case 'PROJECT': return 'Project';
      case 'AD_HOC': return 'Ad Hoc';
      default: return type;
    }
  };

  const handleUpdateCycleStatus = async (cycleId: string, newStatus: AppraisalCycleStatus) => {
    try {
      await performanceApi.updateAppraisalCycleStatus(cycleId, newStatus);
      // Refresh cycles
      fetchCycles();
      alert(`Cycle status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating cycle status:', error);
      alert('Failed to update cycle status');
    }
  };

  const handleCreateAssignments = async (cycleId: string) => {
    try {
      await performanceApi.createAppraisalAssignments(cycleId);
      alert('Assignments created successfully');
    } catch (error) {
      console.error('Error creating assignments:', error);
      alert('Failed to create assignments');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appraisal Cycles</h1>
          <p className="text-gray-600 mt-1">
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

      {/* Cycle Stats */}
      {cycles.length > 0 && (
        <div className="bg-black border-neutral-700 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{cycles.length}</p>
              <p className="text-sm text-gray-500">Total Cycles</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {cycles.filter(c => c.status === AppraisalCycleStatus.ACTIVE).length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {cycles.filter(c => c.status === AppraisalCycleStatus.PLANNED).length}
              </p>
              <p className="text-sm text-gray-500">Planned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {cycles.filter(c => c.status === AppraisalCycleStatus.ARCHIVED).length}
              </p>
              <p className="text-sm text-gray-500">Archived</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-black border-neutral-700 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search cycles..."
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
      </div>

      {/* Cycles List */}
      {filteredCycles.length === 0 ? (
        <div className="bg-black border-neutral-700 rounded-lg p-12 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cycles found</h3>
          <p className="text-gray-500 mb-4">
            {cycles.length === 0
              ? "You haven't created any appraisal cycles yet."
              : "No cycles match your search criteria."}
          </p>
          <Link href="/performance/cycles/create">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2 mx-auto">
              <Plus size={16} />
              Create Your First Cycle
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCycles.map((cycle) => (
            <div key={cycle._id} className="bg-black border-neutral-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{cycle.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(cycle.status)}
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {getCycleTypeLabel(cycle.cycleType)}
                        </span>
                      </div>
                      {cycle.description && (
                        <p className="text-sm text-gray-500 mt-1">{cycle.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Start: {new Date(cycle.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>End: {new Date(cycle.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Templates: {cycle.templateAssignments?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/performance/cycles/${cycle._id}/assignments`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                      <Users size={14} />
                      Assignments
                    </button>
                  </Link>

                  <div className="flex space-x-2">
                    <Link href={`/performance/cycles/view/${cycle._id}`}>
                      <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="View">
                        <Eye size={16} />
                      </button>
                    </Link>
                    <Link href={`/performance/cycles/edit/${cycle._id}`}>
                      <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md" title="Edit">
                        <Edit size={16} />
                      </button>
                    </Link>
                    <button
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                      title="Duplicate"
                      onClick={() => console.log('Duplicate cycle:', cycle._id)}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {cycle.status === AppraisalCycleStatus.PLANNED && (
                  <button
                    onClick={() => handleUpdateCycleStatus(cycle._id, AppraisalCycleStatus.ACTIVE)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Activate Cycle
                  </button>
                )}
                {cycle.status === AppraisalCycleStatus.ACTIVE && (
                  <>
                    
                    <button
                      onClick={() => handleUpdateCycleStatus(cycle._id, AppraisalCycleStatus.CLOSED)}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                    >
                      Close Cycle
                    </button>
                  </>
                )}
                {cycle.status === AppraisalCycleStatus.CLOSED && (
                  <button
                    onClick={() => handleUpdateCycleStatus(cycle._id, AppraisalCycleStatus.ARCHIVED)}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                  >
                    Archive Cycle
                  </button>
                )}
                <Link href={`/performance/analytics?cycleId=${cycle._id}`}>
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 flex items-center gap-1">
                    <BarChart size={12} />
                    Analytics
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
