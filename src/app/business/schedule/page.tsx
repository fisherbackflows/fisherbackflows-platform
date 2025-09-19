'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Phone,
  Edit,
  Eye,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  date: string;
  time: string;
  duration: number; // minutes
  serviceType: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  technician?: string;
  notes?: string;
  deviceCount: number;
}

export default function ScheduleManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Load appointments - this will be replaced with actual API call
    const loadAppointments = async () => {
      try {
        // Mock data for now
        const mockAppointments: Appointment[] = [
          {
            id: '1',
            customerName: 'John Smith',
            customerPhone: '(253) 555-0123',
            address: '123 Main St',
            city: 'Tacoma',
            state: 'WA',
            zip: '98401',
            date: '2024-12-19',
            time: '09:00',
            duration: 60,
            serviceType: 'Annual Backflow Test',
            status: 'scheduled',
            technician: 'Mike Johnson',
            deviceCount: 1,
            notes: 'Customer prefers morning appointments'
          },
          {
            id: '2',
            customerName: 'Sarah Wilson',
            customerPhone: '(253) 555-0124',
            address: '456 Oak Ave',
            city: 'Seattle',
            state: 'WA',
            zip: '98101',
            date: '2024-12-19',
            time: '11:00',
            duration: 90,
            serviceType: 'Installation Test',
            status: 'in_progress',
            technician: 'Mike Johnson',
            deviceCount: 2
          },
          {
            id: '3',
            customerName: 'David Chen',
            customerPhone: '(253) 555-0125',
            address: '789 Pine St',
            city: 'Spokane',
            state: 'WA',
            zip: '99201',
            date: '2024-12-19',
            time: '14:00',
            duration: 60,
            serviceType: 'Annual Backflow Test',
            status: 'scheduled',
            technician: 'Lisa Rodriguez',
            deviceCount: 1
          },
          {
            id: '4',
            customerName: 'Maria Garcia',
            customerPhone: '(253) 555-0126',
            address: '321 Cedar Blvd',
            city: 'Tacoma',
            state: 'WA',
            zip: '98402',
            date: '2024-12-20',
            time: '10:00',
            duration: 120,
            serviceType: 'Repair Service',
            status: 'scheduled',
            technician: 'Mike Johnson',
            deviceCount: 3
          }
        ];

        setAppointments(mockAppointments);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.customerPhone.includes(searchTerm);

    const matchesFilter = filterStatus === 'all' || appointment.status === filterStatus;

    const matchesDate = appointment.date === selectedDate;

    return matchesSearch && matchesFilter && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
      case 'in_progress': return 'border-blue-400 bg-blue-500/20 text-blue-200';
      case 'scheduled': return 'border-amber-400 bg-amber-500/20 text-amber-200';
      case 'cancelled': return 'border-red-400 bg-red-500/20 text-red-200';
      case 'no_show': return 'border-orange-400 bg-orange-500/20 text-orange-200';
      default: return 'border-gray-400 bg-gray-500/20 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      case 'no_show': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const todayAppointments = appointments.filter(a => a.date === selectedDate);
  const scheduledCount = todayAppointments.filter(a => a.status === 'scheduled').length;
  const inProgressCount = todayAppointments.filter(a => a.status === 'in_progress').length;
  const completedCount = todayAppointments.filter(a => a.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-500/5" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Schedule Management</h1>
              <p className="text-white/60">Manage appointments and routes</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/business">
                <Button variant="outline" className="border-blue-400 text-white/80">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Link href="/business/schedule/new">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Test
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* Daily Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-amber-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Scheduled Today</p>
                <p className="text-2xl font-bold text-white">{scheduledCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-300" />
            </div>
          </div>

          <div className="glass border border-blue-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-white">{inProgressCount}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-300" />
            </div>
          </div>

          <div className="glass border border-emerald-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Completed Today</p>
                <p className="text-2xl font-bold text-white">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-300" />
            </div>
          </div>

          <div className="glass border border-purple-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${(completedCount * 350).toLocaleString()}
                </p>
              </div>
              <Navigation className="h-8 w-8 text-purple-300" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Date Picker */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-white/60" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                placeholder="Search appointments..."
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="border-blue-400"
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
                className="border-blue-400"
              >
                Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="glass border border-blue-400 rounded-xl glow-blue-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Time</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Customer</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Location</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Service</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Technician</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Status</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">

                    {/* Time */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{appointment.time}</p>
                        <p className="text-white/60 text-sm">{appointment.duration} min</p>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{appointment.customerName}</p>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-white/60" />
                          <span className="text-white/60 text-sm">{appointment.customerPhone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-white/60 mt-0.5" />
                        <div>
                          <p className="text-white/80 text-sm">{appointment.address}</p>
                          <p className="text-white/60 text-xs">
                            {appointment.city}, {appointment.state} {appointment.zip}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white/80">{appointment.serviceType}</p>
                        <p className="text-white/60 text-sm">{appointment.deviceCount} device(s)</p>
                      </div>
                    </td>

                    {/* Technician */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-white/80">{appointment.technician || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 w-fit ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span>{appointment.status.replace('_', ' ').toUpperCase()}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link href={`/business/schedule/${appointment.id}`}>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link href={`/business/schedule/${appointment.id}/edit`}>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">
                No appointments scheduled for {new Date(selectedDate).toLocaleDateString()}
              </p>
              <Link href="/business/schedule/new" className="mt-4 inline-block">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule First Appointment
                </Button>
              </Link>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}