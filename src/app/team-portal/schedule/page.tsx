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
  Edit
} from 'lucide-react';
import Link from 'next/link';

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
  scheduled: { label: 'Scheduled', color: 'bg-gray-100 text-gray-800' },
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

  useEffect(() => {
    // Load sample appointments
    const today = new Date();
    const sampleAppointments: Appointment[] = [
      {
        id: '1',
        customerId: '1',
        customerName: 'Johnson Properties LLC',
        customerPhone: '(253) 555-0123',
        address: '1234 Pacific Ave',
        city: 'Tacoma',
        date: today.toISOString().split('T')[0],
        time: '09:00',
        duration: 45,
        type: 'test',
        status: 'confirmed',
        notes: 'Annual backflow test, 3 devices',
        deviceCount: 3,
        estimatedCost: 255,
        priority: 'medium'
      },
      {
        id: '2',
        customerId: '2',
        customerName: 'Smith Residence',
        customerPhone: '(253) 555-0124',
        address: '5678 6th Ave',
        city: 'Tacoma',
        date: today.toISOString().split('T')[0],
        time: '11:00',
        duration: 30,
        type: 'test',
        status: 'scheduled',
        notes: 'First time customer, single device',
        deviceCount: 1,
        estimatedCost: 85,
        priority: 'low'
      },
      {
        id: '3',
        customerId: '3',
        customerName: 'Parkland Medical Center',
        customerPhone: '(253) 555-0125',
        address: '910 112th St E',
        city: 'Parkland',
        date: today.toISOString().split('T')[0],
        time: '14:00',
        duration: 90,
        type: 'repair',
        status: 'confirmed',
        notes: 'Failed test last week, needs repair',
        deviceCount: 5,
        estimatedCost: 425,
        priority: 'high'
      },
      {
        id: '4',
        customerId: '4',
        customerName: 'Harbor View Apartments',
        customerPhone: '(253) 555-0126',
        address: '2500 Harborview Dr',
        city: 'Gig Harbor',
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '08:00',
        duration: 120,
        type: 'test',
        status: 'scheduled',
        notes: 'Multi-unit building, 8 devices',
        deviceCount: 8,
        estimatedCost: 680,
        priority: 'medium'
      },
      {
        id: '5',
        customerId: '5',
        customerName: 'Downtown Deli',
        customerPhone: '(253) 555-0127',
        address: '789 Commerce St',
        city: 'Tacoma',
        date: new Date(today.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:30',
        duration: 45,
        type: 'installation',
        status: 'confirmed',
        notes: 'New backflow device installation',
        deviceCount: 1,
        estimatedCost: 850,
        priority: 'high'
      }
    ];

    setTimeout(() => {
      setAppointments(sampleAppointments);
      setLoading(false);
    }, 500);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <Button size="sm" asChild>
              <Link href="/app/schedule/new">
                <Plus className="h-4 w-4 mr-2" />
                Book
              </Link>
            </Button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-0">
                {getDateTitle()}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { key: 'active', label: 'Active', count: appointments.filter(a => ['scheduled', 'confirmed', 'in-progress'].includes(a.status)).length },
              { key: 'all', label: 'All', count: appointments.length },
              { key: 'scheduled', label: 'Scheduled', count: appointments.filter(a => a.status === 'scheduled').length },
              { key: 'confirmed', label: 'Confirmed', count: appointments.filter(a => a.status === 'confirmed').length },
              { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  statusFilter === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-3">
          {getDayAppointments.length > 0 ? (
            getDayAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg shadow-sm">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-600 font-bold text-lg">
                        {formatTime(appointment.time)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${appointmentTypes[appointment.type].color}`}>
                          <span className="mr-1">{appointmentTypes[appointment.type].icon}</span>
                          {appointmentTypes[appointment.type].label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[appointment.status].color}`}>
                          {statusConfig[appointment.status].label}
                        </span>
                        {appointment.priority === 'high' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {appointment.customerName}
                      </h3>
                      <div className="text-sm text-gray-600">
                        {formatDuration(appointment.duration)} • ${appointment.estimatedCost}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {appointment.address}, {appointment.city}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`tel:${appointment.customerPhone}`} className="hover:text-blue-600">
                          {appointment.customerPhone}
                        </a>
                      </div>
                      <div className="text-sm text-gray-600">
                        {appointment.deviceCount} device{appointment.deviceCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                        {appointment.notes}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex space-x-2">
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {appointment.status === 'in-progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`tel:${appointment.customerPhone}`}>
                            <Phone className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/app/test-report?customer=${appointment.customerId}`}>
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
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments {statusFilter === 'all' ? '' : `(${statusFilter})`}
              </h3>
              <p className="text-gray-500 mb-4">
                {getDateTitle()}
              </p>
              <Button asChild>
                <Link href="/app/schedule/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Book New Appointment
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          <Link href="/app" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <div className="h-6 w-6 bg-gray-400 rounded"></div>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/app/customers" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <User className="h-6 w-6" />
            <span className="text-xs">Customers</span>
          </Link>
          <Link href="/app/test-report" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Plus className="h-6 w-6" />
            <span className="text-xs">Test</span>
          </Link>
          <Link href="/app/schedule" className="flex flex-col items-center py-2 px-1 text-blue-600 bg-blue-50">
            <Calendar className="h-6 w-6" />
            <span className="text-xs font-medium">Schedule</span>
          </Link>
          <Link href="/app/more" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            </div>
            <span className="text-xs">More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}