'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  Plus,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CalendarAppointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes: string;
  priority: 'low' | 'medium' | 'high';
}

interface UnifiedCalendarProps {
  mode: 'customer' | 'team';
  appointments: CalendarAppointment[];
  onAppointmentClick?: (appointment: CalendarAppointment) => void;
  onDateSelect?: (date: string) => void;
  showActions?: boolean;
  className?: string;
}

export function UnifiedCalendar({ 
  mode, 
  appointments, 
  onAppointmentClick,
  onDateSelect,
  showActions = false,
  className = '' 
}: UnifiedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date): CalendarAppointment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const matchesDate = apt.date === dateStr;
      const matchesFilter = statusFilter === 'all' || apt.status === statusFilter;
      return matchesDate && matchesFilter;
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-yellow-500/20 border-yellow-400 text-yellow-300',
      confirmed: 'bg-blue-500/20 border-blue-400 text-blue-300',
      'in-progress': 'bg-orange-500/20 border-orange-400 text-orange-300',
      completed: 'bg-green-500/20 border-green-400 text-green-300',
      cancelled: 'bg-red-500/20 border-red-400 text-red-300'
    };
    return colors[status] || 'bg-gray-500/20 border-gray-400 text-gray-300';
  };

  const formatTime = (time: string) => {
    if (time.includes('AM') || time.includes('PM')) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const monthDays = getMonthDays();
  const today = new Date().toDateString();

  return (
    <div className={`glass rounded-xl border border-blue-400 glow-blue-sm ${className}`}>
      {/* Calendar Header */}
      <div className="p-6 border-b border-blue-400/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-2xl font-bold text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentDate(new Date())}
                className="text-blue-300 hover:text-white"
              >
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>\n          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}\n            <div className="flex items-center space-x-1 bg-black/30 rounded-lg p-1">
              {['month', 'week', 'day'].map((view) => (
                <Button
                  key={view}
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(view as any)}
                  className={`capitalize ${
                    viewMode === view 
                      ? 'bg-blue-500 text-white' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {view === 'month' && <Grid3X3 className="h-4 w-4" />}
                  {view === 'week' && <List className="h-4 w-4" />}
                  {view === 'day' && <CalendarIcon className="h-4 w-4" />}
                </Button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-black/50 border border-blue-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {showActions && mode === 'team' && (
              <Button className="glass-btn-primary hover:glow-blue text-white" asChild>
                <Link href="/team-portal/schedule/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-white/70 font-semibold py-2 text-sm">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Body */}
      <div className="p-6">
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((date, index) => {
              const dayAppointments = getAppointmentsForDate(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === today;
              
              return (
                <div
                  key={index}
                  onClick={() => onDateSelect && onDateSelect(date.toISOString().split('T')[0])}
                  className={`min-h-[100px] p-2 border border-blue-500/20 rounded-lg cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-500/5 ${
                    isToday ? 'bg-blue-500/20 border-blue-400' : ''
                  } ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? 'text-blue-300' : isCurrentMonth ? 'text-white' : 'text-white/50'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick && onAppointmentClick(apt);
                        }}
                        className={`text-xs p-1 rounded border cursor-pointer truncate ${getStatusColor(apt.status)}`}
                        title={`${formatTime(apt.time)} - ${apt.customerName}`}
                      >
                        <div className="font-semibold">{formatTime(apt.time)}</div>
                        <div className="truncate">{apt.customerName}</div>
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-white/60 text-center">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'day' && (
          <div className="space-y-3">
            <div className="text-lg font-semibold text-white mb-4">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            
            {getAppointmentsForDate(currentDate).map((apt) => (
              <div
                key={apt.id}
                onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                className="p-4 border border-blue-500/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-300">{formatTime(apt.time)}</div>
                      <div className="text-xs text-white/60">{apt.duration}m</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{apt.customerName}</h3>
                      <div className="flex items-center space-x-4 text-white/80 text-sm">
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{apt.address}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{apt.customerPhone}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(apt.status)}`}>
                    {apt.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}

            {getAppointmentsForDate(currentDate).length === 0 && (
              <div className="text-center py-12 text-white/60">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg">No appointments scheduled</p>
                <p className="text-sm">for this date</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'week' && (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-white mb-4">
              Week of {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const date = new Date(currentDate);
                date.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
                const dayAppointments = getAppointmentsForDate(date);
                
                return (
                  <div key={dayIndex} className="border border-blue-500/30 rounded-lg p-3">
                    <div className="text-center mb-3">
                      <div className="text-xs text-white/70 font-semibold">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold ${
                        date.toDateString() === today ? 'text-blue-300' : 'text-white'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 4).map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                          className={`text-xs p-2 rounded border cursor-pointer ${getStatusColor(apt.status)}`}
                        >
                          <div className="font-semibold">{formatTime(apt.time)}</div>
                          <div className="truncate">{apt.customerName}</div>
                        </div>
                      ))}
                      {dayAppointments.length > 4 && (
                        <div className="text-xs text-white/60 text-center">
                          +{dayAppointments.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Footer */}
      <div className="px-6 py-4 border-t border-blue-400/50">
        <div className="flex items-center justify-between text-sm text-white/80">
          <div className="flex items-center space-x-4">
            <span>Viewing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-blue-500/20 rounded text-blue-300">
                {statusFilter} filter active
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status Legend */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs">Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs">Confirmed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}