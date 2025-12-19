// app/(protected)/dashboard/admin/leaves/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, Calendar, Users, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';

interface ReportData {
  totalEmployees: number;
  totalLeaveRequests: number;
  approvalRate: number;
  avgLeaveDays: number;
  popularLeaveTypes: Array<{ name: string; count: number; percentage: number }>;
  departmentStats: Array<{ department: string; totalRequests: number; approved: number }>;
}

export default function LeavesReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    period: 'month',
    department: 'all',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/leaves/reports', { params: filters });
      setReportData(response.data);
    } catch (error: any) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast.success(`Exporting report as ${format.toUpperCase()}`);
    // Implement export functionality
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Analytics & Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive leave statistics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('pdf')}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-300">Time Period</Label>
              <Select value={filters.period} onValueChange={(v) => setFilters({...filters, period: v})}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="week" className="dark:text-gray-300 dark:hover:bg-gray-700">Last Week</SelectItem>
                  <SelectItem value="month" className="dark:text-gray-300 dark:hover:bg-gray-700">Last Month</SelectItem>
                  <SelectItem value="quarter" className="dark:text-gray-300 dark:hover:bg-gray-700">Last Quarter</SelectItem>
                  <SelectItem value="year" className="dark:text-gray-300 dark:hover:bg-gray-700">Last Year</SelectItem>
                  <SelectItem value="custom" className="dark:text-gray-300 dark:hover:bg-gray-700">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-300">Year</Label>
              <Input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-300">Department</Label>
              <Select value={filters.department} onValueChange={(v) => setFilters({...filters, department: v})}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">All Departments</SelectItem>
                  <SelectItem value="engineering" className="dark:text-gray-300 dark:hover:bg-gray-700">Engineering</SelectItem>
                  <SelectItem value="sales" className="dark:text-gray-300 dark:hover:bg-gray-700">Sales</SelectItem>
                  <SelectItem value="marketing" className="dark:text-gray-300 dark:hover:bg-gray-700">Marketing</SelectItem>
                  <SelectItem value="hr" className="dark:text-gray-300 dark:hover:bg-gray-700">Human Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={fetchReportData}>
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalEmployees}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Leave Requests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalLeaveRequests}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Approval Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.approvalRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Leave Days</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.avgLeaveDays}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Leave Types */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Popular Leave Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.popularLeaveTypes.map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          #{index + 1}
                        </Badge>
                        <span className="text-gray-900 dark:text-white">{type.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">{type.count} requests</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{type.percentage}% of total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Stats */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Department Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.departmentStats.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{dept.department}</span>
                        <span className="text-gray-900 dark:text-white">
                          {dept.approved}/{dept.totalRequests} approved
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(dept.approved / dept.totalRequests) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Total: {dept.totalRequests}</span>
                        <span>{Math.round((dept.approved / dept.totalRequests) * 100)}% approval rate</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('pdf')} 
                  className="h-auto py-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileText className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">PDF Report</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Formatted printable report</p>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('excel')} 
                  className="h-auto py-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileText className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Excel Report</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Data analysis spreadsheet</p>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('csv')} 
                  className="h-auto py-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">CSV Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Raw data for integration</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}