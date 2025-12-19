'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import { Users, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface CurrentLeave {
  from: string;
  to: string;
  leaveTypeName: string;
}

interface TeamMember {
  _id: string;
  fullName: string;
  workEmail?: string;
  departmentName?: string;
  positionTitle?: string;
  onLeaveToday: boolean;
  pendingRequestsCount: number;
  currentLeave?: CurrentLeave | null;
  remainingAnnualDays?: number;
}

export default function ManagerTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<TeamMember[]>('/leaves/manager/team');
      setTeam(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading team overview...</p>
        </div>
      </div>
    );
  }

  const totalMembers = team.length;
  const onLeaveCount = team.filter((m) => m.onLeaveToday).length;
  const pendingCount = team.reduce(
    (sum, m) => sum + (m.pendingRequestsCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Team</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Overview of your direct reports and their leave status
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Team Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMembers}</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">On Leave Today</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{onLeaveCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">Team Leave Status</CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadTeam}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No team members found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="dark:hover:bg-gray-700">
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Employee</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Department / Position</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Status Today</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Current / Upcoming Leave</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Pending Requests</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Annual Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((m) => (
                  <TableRow key={m._id} className="dark:hover:bg-gray-700/50">
                    <TableCell className="dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">{m.fullName}</div>
                      {m.workEmail && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {m.workEmail}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="dark:border-gray-700">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {m.departmentName || '-'}
                      </div>
                      {m.positionTitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {m.positionTitle}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="dark:border-gray-700">
                      {m.onLeaveToday ? (
                        <Badge variant="destructive" className="flex items-center gap-1 dark:bg-red-900/30 dark:text-red-300">
                          <Calendar className="h-3 w-3" />
                          On Leave
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Available
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="dark:border-gray-700">
                      {m.currentLeave ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {m.currentLeave.leaveTypeName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(m.currentLeave.from).toLocaleDateString()}{' '}
                            –{' '}
                            {new Date(m.currentLeave.to).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="dark:border-gray-700">
                      {m.pendingRequestsCount > 0 ? (
                        <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                          {m.pendingRequestsCount} pending
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">None</span>
                      )}
                    </TableCell>
                    <TableCell className="dark:border-gray-700">
                      {m.remainingAnnualDays != null ? (
                        <span className="text-sm text-gray-900 dark:text-gray-300">
                          {m.remainingAnnualDays} days
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}