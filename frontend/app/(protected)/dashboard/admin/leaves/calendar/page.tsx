// app/(protected)/dashboard/admin/leaves/calendar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Holiday {
  _id: string;
  type: 'NATIONAL' | 'ORGANIZATIONAL' | 'WEEKLY_REST';
  startDate: string;
  endDate?: string;
  name?: string;
  active: boolean;
}

interface BlockedPeriod {
  from: string;
  to: string;
  reason: string;
}

interface CalendarData {
  _id: string;
  year: number;
  holidays: Holiday[];
  blockedPeriods: BlockedPeriod[];
  createdAt: string;
  updatedAt: string;
}

export default function LeavesCalendarPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [isAddBlockedOpen, setIsAddBlockedOpen] = useState(false);
  const [isDeleteHolidayOpen, setIsDeleteHolidayOpen] = useState(false);
  const [isDeleteBlockedOpen, setIsDeleteBlockedOpen] = useState(false);
  
  // Form states
  const [holidayForm, setHolidayForm] = useState({
    type: 'NATIONAL' as 'NATIONAL' | 'ORGANIZATIONAL' | 'WEEKLY_REST',
    startDate: '',
    endDate: '',
    name: '',
  });
  
  const [blockedForm, setBlockedForm] = useState({
    from: '',
    to: '',
    reason: '',
  });
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchCalendarData();
    fetchAllHolidays();
  }, [selectedYear]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/leaves/calendar/${selectedYear}`);
      setCalendarData(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        createCalendarForYear();
      } else {
        console.error('Error fetching calendar:', error);
        toast.error(error.response?.data?.message || 'Failed to load calendar');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllHolidays = async () => {
    try {
      const response = await axiosInstance.get('/leaves/holidays');
      setAllHolidays(response.data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const createCalendarForYear = async () => {
    try {
      await axiosInstance.post('/leaves/calendar', { year: selectedYear });
      toast.success(`Calendar for ${selectedYear} created`);
      fetchCalendarData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create calendar');
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.startDate) {
      toast.error('Start date is required');
      return;
    }

    try {
      const holidayResponse = await axiosInstance.post('/leaves/holidays', {
        type: holidayForm.type,
        startDate: holidayForm.startDate,
        endDate: holidayForm.endDate || holidayForm.startDate,
        name: holidayForm.name || `${holidayForm.type} Holiday`,
      });

      await axiosInstance.patch(`/leaves/calendar/${selectedYear}/add-holiday`, {
        holidayId: holidayResponse.data._id,
      });

      toast.success('Holiday added successfully');
      setIsAddHolidayOpen(false);
      setHolidayForm({
        type: 'NATIONAL',
        startDate: '',
        endDate: '',
        name: '',
      });
      fetchCalendarData();
      fetchAllHolidays();
    } catch (error: any) {
      console.error('Error adding holiday:', error);
      toast.error(error.response?.data?.message || 'Failed to add holiday');
    }
  };

  const handleAddBlockedPeriod = async () => {
    if (!blockedForm.from || !blockedForm.to) {
      toast.error('Both from and to dates are required');
      return;
    }

    try {
      await axiosInstance.patch(`/leaves/calendar/${selectedYear}/add-blocked`, {
        from: blockedForm.from,
        to: blockedForm.to,
        reason: blockedForm.reason || 'Blocked Period',
      });

      toast.success('Blocked period added successfully');
      setIsAddBlockedOpen(false);
      setBlockedForm({ from: '', to: '', reason: '' });
      fetchCalendarData();
    } catch (error: any) {
      console.error('Error adding blocked period:', error);
      toast.error(error.response?.data?.message || 'Failed to add blocked period');
    }
  };

  const handleRemoveHoliday = async () => {
    if (!selectedItem) return;

    try {
      await axiosInstance.patch(`/leaves/calendar/${selectedYear}/remove-holiday`, {
        holidayId: selectedItem._id,
      });

      await axiosInstance.delete(`/leaves/holidays/${selectedItem._id}`);

      toast.success('Holiday removed successfully');
      setIsDeleteHolidayOpen(false);
      setSelectedItem(null);
      fetchCalendarData();
      fetchAllHolidays();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove holiday');
    }
  };

  const handleRemoveBlockedPeriod = async () => {
    if (!selectedItem) return;

    try {
      const index = calendarData?.blockedPeriods.findIndex(
        (bp: any) => bp.from === selectedItem.from && bp.to === selectedItem.to
      ) ?? -1;
      
      if (index !== -1) {
        await axiosInstance.patch(`/leaves/calendar/${selectedYear}/remove-blocked/${index}`);
        toast.success('Blocked period removed');
        setIsDeleteBlockedOpen(false);
        setSelectedItem(null);
        fetchCalendarData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove blocked period');
    }
  };

  const getHolidayBadgeColor = (type: string) => {
    switch (type) {
      case 'NATIONAL': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'ORGANIZATIONAL': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'WEEKLY_REST': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const isDateHoliday = (date: Date) => {
    if (!calendarData?.holidays) return false;
    
    return calendarData.holidays.some(holiday => {
      const startDate = new Date(holiday.startDate);
      const endDate = holiday.endDate ? new Date(holiday.endDate) : startDate;
      return date >= startDate && date <= endDate;
    });
  };

  const isDateBlocked = (date: Date) => {
    if (!calendarData?.blockedPeriods) return false;
    
    return calendarData.blockedPeriods.some(bp => {
      const from = new Date(bp.from);
      const to = new Date(bp.to);
      return date >= from && date <= to;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const availableHolidays = allHolidays.filter(holiday => {
    const holidayYear = new Date(holiday.startDate).getFullYear();
    return holidayYear === selectedYear && 
           holiday.active && 
           !calendarData?.holidays?.some(h => h._id === holiday._id);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage holidays and blocked periods for {selectedYear}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg min-w-[80px] text-center text-gray-900 dark:text-white">
              {selectedYear}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsAddHolidayOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Holidays</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calendarData?.holidays?.length || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Blocked Periods</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calendarData?.blockedPeriods?.length || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Available Holidays</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {availableHolidays.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="dark:bg-gray-800 dark:border-gray-700">
          <TabsTrigger value="calendar" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="holidays" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">Holidays</TabsTrigger>
          <TabsTrigger value="blocked" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">Blocked Periods</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Calendar View</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Holidays are shown in red, blocked periods in blue
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border dark:border-gray-700 dark:bg-gray-800"
                  modifiers={{
                    holiday: (date) => isDateHoliday(date),
                    blocked: (date) => isDateBlocked(date),
                  }}
                  modifiersStyles={{
                    holiday: {
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      fontWeight: 'bold',
                      borderColor: '#fca5a5',
                    },
                    blocked: {
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1',
                      fontWeight: 'bold',
                      borderColor: '#7dd3fc',
                    },
                  }}
                />
              </div>
              <div className="lg:w-1/3 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Legend</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700"></div>
                      <span className="text-gray-900 dark:text-gray-300">Holiday</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700"></div>
                      <span className="text-gray-900 dark:text-gray-300">Blocked Period</span>
                    </div>
                  </div>
                </div>
                {selectedDate && (
                  <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Selected Date: {formatDate(selectedDate.toISOString())}</h3>
                    {isDateHoliday(selectedDate) && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="font-medium text-red-700 dark:text-red-300">Holiday on this date</p>
                        {calendarData?.holidays
                          .filter(h => {
                            const start = new Date(h.startDate);
                            const end = h.endDate ? new Date(h.endDate) : start;
                            return selectedDate >= start && selectedDate <= end;
                          })
                          .map((holiday, index) => (
                            <div key={index} className="mt-2">
                              <p className="text-sm text-gray-900 dark:text-gray-300">{holiday.name || 'Holiday'}</p>
                              <Badge className={getHolidayBadgeColor(holiday.type)}>
                                {holiday.type}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                    {isDateBlocked(selectedDate) && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="font-medium text-blue-700 dark:text-blue-300">Blocked Period</p>
                        {calendarData?.blockedPeriods
                          .filter(bp => {
                            const from = new Date(bp.from);
                            const to = new Date(bp.to);
                            return selectedDate >= from && selectedDate <= to;
                          })
                          .map((period, index) => (
                            <div key={index} className="mt-2">
                              <p className="text-sm text-gray-900 dark:text-gray-300">{period.reason}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(period.from)} - {formatDate(period.to)}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                    {!isDateHoliday(selectedDate) && !isDateBlocked(selectedDate) && (
                      <p className="text-gray-500 dark:text-gray-400">No special events on this date</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-gray-900 dark:text-white">
                <span>Holidays in {selectedYear}</span>
                <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                  {calendarData?.holidays?.length || 0} holidays
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Loading holidays...</p>
                </div>
              ) : !calendarData?.holidays?.length ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No holidays configured for {selectedYear}
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarData.holidays.map((holiday) => (
                    <div
                      key={holiday._id}
                      className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={getHolidayBadgeColor(holiday.type)}>
                            {holiday.type}
                          </Badge>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {holiday.name || `${holiday.type} Holiday`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(holiday.startDate)}
                          {holiday.endDate && holiday.endDate !== holiday.startDate && (
                            <> → {formatDate(holiday.endDate)}</>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Status: {holiday.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(holiday);
                            setIsDeleteHolidayOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-gray-900 dark:text-white">
                <span>Blocked Periods</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddBlockedOpen(true)}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Blocked Period
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Blocked periods prevent leave requests during specific times
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!calendarData?.blockedPeriods?.length ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No blocked periods configured
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarData.blockedPeriods.map((period, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(period.from)} → {formatDate(period.to)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {period.reason}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(period);
                          setIsDeleteBlockedOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Holiday Dialog */}
      <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add New Holiday</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Create a new holiday. These days will be excluded from leave calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-300">Holiday Type *</Label>
              <Select
                value={holidayForm.type}
                onValueChange={(value: any) => setHolidayForm({...holidayForm, type: value})}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select holiday type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="NATIONAL" className="dark:text-gray-300 dark:hover:bg-gray-700">National Holiday</SelectItem>
                  <SelectItem value="ORGANIZATIONAL" className="dark:text-gray-300 dark:hover:bg-gray-700">Organizational Holiday</SelectItem>
                  <SelectItem value="WEEKLY_REST" className="dark:text-gray-300 dark:hover:bg-gray-700">Weekly Rest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-300">Holiday Name</Label>
              <Input
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({...holidayForm, name: e.target.value})}
                placeholder="e.g., New Year's Day, Eid Al-Fitr"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-300">Start Date *</Label>
                <Input
                  type="date"
                  value={holidayForm.startDate}
                  onChange={(e) => setHolidayForm({...holidayForm, startDate: e.target.value})}
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-300">End Date</Label>
                <Input
                  type="date"
                  value={holidayForm.endDate}
                  onChange={(e) => setHolidayForm({...holidayForm, endDate: e.target.value})}
                  min={holidayForm.startDate}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Leave empty for single-day holiday
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddHolidayOpen(false)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleAddHoliday} disabled={!holidayForm.startDate}>
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Blocked Period Dialog */}
      <Dialog open={isAddBlockedOpen} onOpenChange={setIsAddBlockedOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add Blocked Period</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Block specific periods where leave requests are not allowed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-300">From Date *</Label>
                <Input
                  type="date"
                  value={blockedForm.from}
                  onChange={(e) => setBlockedForm({...blockedForm, from: e.target.value})}
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-300">To Date *</Label>
                <Input
                  type="date"
                  value={blockedForm.to}
                  onChange={(e) => setBlockedForm({...blockedForm, to: e.target.value})}
                  min={blockedForm.from}
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-300">Reason *</Label>
              <Textarea
                value={blockedForm.reason}
                onChange={(e) => setBlockedForm({...blockedForm, reason: e.target.value})}
                placeholder="e.g., Year-end closing, Peak season, Company shutdown"
                rows={3}
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddBlockedOpen(false)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button 
              onClick={handleAddBlockedPeriod} 
              disabled={!blockedForm.from || !blockedForm.to || !blockedForm.reason}
            >
              Add Blocked Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Confirmation */}
      <AlertDialog open={isDeleteHolidayOpen} onOpenChange={setIsDeleteHolidayOpen}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Remove Holiday</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to remove this holiday? This action cannot be undone.
              <br /><br />
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedItem?.name || selectedItem?.type + ' Holiday'}
              </span>
              <br />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(selectedItem?.startDate)}
                {selectedItem?.endDate && selectedItem.endDate !== selectedItem.startDate && (
                  <> - {formatDate(selectedItem.endDate)}</>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveHoliday}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900"
            >
              Remove Holiday
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Blocked Period Confirmation */}
      <AlertDialog open={isDeleteBlockedOpen} onOpenChange={setIsDeleteBlockedOpen}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Remove Blocked Period</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to remove this blocked period?
              <br /><br />
              <span className="font-semibold text-gray-900 dark:text-white">{selectedItem?.reason}</span>
              <br />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(selectedItem?.from)} - {formatDate(selectedItem?.to)}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveBlockedPeriod}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900"
            >
              Remove Blocked Period
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}