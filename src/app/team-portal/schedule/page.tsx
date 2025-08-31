'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Plus,
  Clock,
  MapPin,
  Phone,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Edit,
  Home,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: 'test' | 'repair' | 'installation' | 'consultation';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
  deviceCount: number;
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high';
}

const appointmentTypes = {
  test: { label: 'Test', color: 'bg-blue-100 text-blue-800', icon: '🔍' },
  repair: { label: 'Repair', color: 'bg-orange-100 text-orange-800', icon: '🔧' },
  installation: { label: 'Install', color: 'bg-green-100 text-green-800', icon: '⚙️' },
  consultation: { label: 'Consult', color: 'bg-purple-100 text-purple-800', icon: '💬' }
};

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-gray-100 text-gray-900' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  'no-show': { label: 'No Show', color: 'bg-red-100 text-red-800' }
};

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Load user info for navigation
    const loadUserInfo = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    loadUserInfo();
  }, []);

  useEffect(() => {
    const loadRealAppointments = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/team/appointments');
        if (!response.ok) {
          throw new Error(`Failed to load appointments: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.appointments) {
          setAppointments(data.appointments);
        } else {
          console.warn('No appointment data available');
          setAppointments([]);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadRealAppointments();
  }, []);

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const matchesDate = apt.date === dateStr;
      const matchesFilter = statusFilter === 'all' || 
        (statusFilter === 'active' && ['scheduled', 'confirmed', 'in-progress'].includes(apt.status)) ||
        apt.status === statusFilter;
      
      return matchesDate && matchesFilter;
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const getDateTitle = () => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (viewMode === 'day') {
      return isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return selectedDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const updateAppointmentStatus = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status: newStatus } : apt
    ));
  };

  const getDayAppointments = getAppointmentsForDate(selectedDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TeamPortalNavigation userInfo={userInfo} />
        <main className="p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
            <LoadingSpinner size="lg" color="blue" text="Loading schedule..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TeamPortalNavigation userInfo={userInfo} />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <header className="bg-white shadow-sm border-b border-slate-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
                <p className="text-slate-600">Manage appointments and scheduling</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                <Link href="/team-portal/schedule/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Link>
              </Button>
            </div>

          </header>

          {/* Date Navigation */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
                  {getDateTitle()}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="ml-4"
                >
                  Today
                </Button>
              </div>
            </div>
          </div>
          {/* Filter Tabs */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Filter Appointments</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'active', label: 'Active', count: appointments.filter(a => ['scheduled', 'confirmed', 'in-progress'].includes(a.status)).length, color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { key: 'all', label: 'All', count: appointments.length, color: 'bg-slate-100 text-slate-700 border-slate-200' },
              { key: 'scheduled', label: 'Scheduled', count: appointments.filter(a => a.status === 'scheduled').length, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
              { key: 'confirmed', label: 'Confirmed', count: appointments.filter(a => a.status === 'confirmed').length, color: 'bg-green-100 text-green-700 border-green-200' },
              { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length, color: 'bg-purple-100 text-purple-700 border-purple-200' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:shadow-md ${
                  statusFilter === filter.key
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                    : `${filter.color} hover:bg-opacity-80`
                }`}
              >
                {filter.label} <span className="ml-1 font-bold">({filter.count})</span>
              </button>
            ))}
          </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-4">
          {getDayAppointments.length > 0 ? (
            getDayAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 rounded-xl px-4 py-2">
                        <div className="text-blue-700 font-bold text-xl">
                          {formatTime(appointment.time)}
                        </div>
                        <div className="text-blue-600 text-xs font-medium">
                          {formatDuration(appointment.duration)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${appointmentTypes[appointment.type].color}`}>
                          <span className="mr-2 text-base">{appointmentTypes[appointment.type].icon}</span>
                          {appointmentTypes[appointment.type].label}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${statusConfig[appointment.status].color}`}>
                          {statusConfig[appointment.status].label}
                        </span>
                        {appointment.priority === 'high' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 text-red-700">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${appointment.estimatedCost}
                        </div>
                        <div className="text-xs text-slate-500">
                          Estimated
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-2xl mb-2">
                        {appointment.customerName}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <MapPin className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{appointment.address}</p>
                            <p className="text-slate-600 text-sm">{appointment.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Phone className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <a href={`tel:${appointment.customerPhone}`} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                              {appointment.customerPhone}
                            </a>
                            <p className="text-slate-600 text-sm">Customer Phone</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">
                          {appointment.deviceCount}
                        </div>
                        <div className="text-sm text-slate-600">
                          Device{appointment.deviceCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-slate-300"></div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">
                          {formatDuration(appointment.duration)}
                        </div>
                        <div className="text-sm text-slate-600">
                          Duration
                        </div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-amber-800 mb-2">Special Notes:</h4>
                        <p className="text-amber-700 text-sm">{appointment.notes}</p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
                      <div className="flex flex-wrap gap-2">
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm Appointment
                          </Button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Start Service
                          </Button>
                        )}
                        {appointment.status === 'in-progress' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-2 sm:ml-auto">
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-initial" asChild>
                          <Link href={`tel:${appointment.customerPhone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-initial" asChild>
                          <Link href={`/team-portal/test-report?customer=${appointment.customerId}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Start Test
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-slate-100 mb-6">
                <Calendar className="h-12 w-12 text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                No appointments found
              </h3>
              <p className="text-slate-600 text-lg mb-2">
                {statusFilter === 'all' ? 'No appointments scheduled' : `No ${statusFilter} appointments`}
              </p>
              <p className="text-slate-500 mb-8">
                {getDateTitle()}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold" asChild>
                <Link href="/team-portal/schedule/new">
                  <Plus className="h-5 w-5 mr-3" />
                  Schedule New Appointment
                </Link>
              </Button>
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}