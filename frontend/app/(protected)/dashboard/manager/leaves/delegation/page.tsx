'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import Select from 'react-select';

interface Employee {
  _id: string;
  fullName: string;
  workEmail?: string;
}

interface Delegation {
  delegateId: string;
  delegateName: string;
  startDate: string;
  endDate: string;
}

// Custom styles for react-select in dark mode
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: 'rgb(55 65 81)', // gray-700
    borderColor: state.isFocused ? 'rgb(75 85 99)' : 'rgb(75 85 99)', // gray-600
    color: 'white',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
    '&:hover': {
      borderColor: 'rgb(107 114 128)', // gray-500
    },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: 'rgb(55 65 81)', // gray-700
    color: 'white',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'rgb(75 85 99)' : 'rgb(55 65 81)', // gray-600 : gray-700
    color: 'white',
    '&:active': {
      backgroundColor: 'rgb(75 85 99)', // gray-600
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: 'white',
  }),
  input: (base: any) => ({
    ...base,
    color: 'white',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: 'rgb(156 163 175)', // gray-400
  }),
};

export default function ManagerDelegationPage() {
  const [team, setTeam] = useState<Employee[]>([]);
  const [currentDelegation, setCurrentDelegation] = useState<Delegation | null>(null);
  const [selectedDelegate, setSelectedDelegate] = useState<Employee | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeamAndDelegation();
  }, []);

  const fetchTeamAndDelegation = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/leaves/requests');
      const allRequests = res.data || [];

      const membersMap: Record<string, Employee> = {};
      allRequests.forEach((r: any) => {
        if (r.employeeId && !membersMap[r.employeeId._id]) {
          membersMap[r.employeeId._id] = r.employeeId;
        }
      });
      setTeam(Object.values(membersMap));

      const delegationRes = await axiosInstance.get<Delegation | null>('/leaves/delegation');
      setCurrentDelegation(delegationRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load delegation data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelegate = async () => {
    if (!selectedDelegate || !startDate || !endDate) {
      toast.error('Please select a delegate and set start/end dates');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post('/leaves/delegation', {
        delegateManagerId: selectedDelegate._id,
        startDate,
        endDate,
      });

      toast.success('Delegate assigned successfully');
      setCurrentDelegation({
        delegateId: selectedDelegate._id,
        delegateName: selectedDelegate.fullName,
        startDate,
        endDate,
      });

      setSelectedDelegate(null);
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign delegate');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading delegation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Delegation Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Assign a delegate during your absence</p>
      </div>

      {/* Current Delegation */}
      {currentDelegation && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Current Delegate</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-2">
            <p><strong className="font-semibold">Name:</strong> {currentDelegation.delegateName}</p>
            <p><strong className="font-semibold">Start:</strong> {new Date(currentDelegation.startDate).toLocaleDateString()}</p>
            <p><strong className="font-semibold">End:</strong> {new Date(currentDelegation.endDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      )}

      {/* Assign Delegate Form */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Assign New Delegate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Delegate</Label>
            <Select
              options={team.map(emp => ({ value: emp._id, label: emp.fullName }))}
              value={selectedDelegate ? { value: selectedDelegate._id, label: selectedDelegate.fullName } : null}
              onChange={(option: any) => {
                const emp = team.find(e => e._id === option.value) || null;
                setSelectedDelegate(emp);
              }}
              styles={customSelectStyles}
              className="dark:select-dark"
              classNamePrefix="react-select"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Start Date</Label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">End Date</Label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <Button 
            onClick={handleAssignDelegate} 
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? 'Assigning...' : 'Assign Delegate'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}