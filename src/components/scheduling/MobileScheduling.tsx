'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Phone,
  MapPin,
  User,
  Smartphone,
  TouchIcon as Touch,
  Vibrate,
  Wifi,
  Battery
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileAppointment {
  id: string;
  customerName: string;
  date: string;
  time: string;
  address: string;
  phone: string;
  status: string;
  type: string;
}

interface MobileSchedulingProps {
  appointments: MobileAppointment[];
  onAppointmentAction?: (appointmentId: string, action: string) => void;
  className?: string;
}

export function MobileScheduling({ 
  appointments, 
  onAppointmentAction,
  className = '' 
}: MobileSchedulingProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Swipe gesture handling for date navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setSwipeDirection('left');
      navigateDate('next');
    } else if (isRightSwipe) {
      setSwipeDirection('right');
      navigateDate('prev');
    }

    // Reset swipe animation after short delay
    setTimeout(() => setSwipeDirection(null), 200);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getAppointmentsForDate = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const formatTime = (time: string) => {
    if (time.includes('AM') || time.includes('PM')) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'completed': return <Check className="h-4 w-4 text-blue-400" />;
      case 'cancelled': return <X className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const dayAppointments = getAppointmentsForDate();
  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className={`glass rounded-xl border border-blue-400 glow-blue-sm ${className}`}>
      {/* Mobile-Optimized Header */}
      <div className="p-4 border-b border-blue-400/50">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigateDate('prev')}
            className="p-3 rounded-full hover:bg-blue-500/10"
          >
            <ChevronLeft className="h-6 w-6 text-blue-400" />
          </Button>
          
          <div 
            className={`text-center transition-transform duration-200 ${
              swipeDirection === 'left' ? 'transform -translate-x-2' :
              swipeDirection === 'right' ? 'transform translate-x-2' : ''
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-2xl font-bold text-white">
              {currentDate.getDate()}
            </div>
            <div className="text-sm text-blue-300 font-medium">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short'
              })}
            </div>
            {isToday && (
              <div className="text-xs text-green-400 font-bold mt-1">TODAY</div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigateDate('next')}
            className="p-3 rounded-full hover:bg-blue-500/10"
          >
            <ChevronRight className="h-6 w-6 text-blue-400" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-center space-x-6 text-center">
          <div>
            <div className="text-xl font-bold text-white">{dayAppointments.length}</div>
            <div className="text-xs text-white/70">Appointments</div>
          </div>
          <div className="w-px h-8 bg-blue-400/50"></div>
          <div>
            <div className="text-xl font-bold text-green-300">
              {dayAppointments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-xs text-white/70">Completed</div>
          </div>
          <div className="w-px h-8 bg-blue-400/50"></div>
          <div>
            <div className="text-xl font-bold text-blue-300">
              {dayAppointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length}
            </div>
            <div className="text-xs text-white/70">Upcoming</div>
          </div>
        </div>
      </div>

      {/* Mobile Appointments List */}
      <div 
        ref={scrollRef}
        className="p-4 max-h-[60vh] overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {dayAppointments.length > 0 ? (
          <div className="space-y-4">
            {dayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-blue-500/50 rounded-2xl p-4 hover:border-blue-400 hover:bg-blue-500/10 transition-all active:scale-95"
              >
                {/* Time and Status Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500/20 border border-blue-400 rounded-xl px-3 py-2 text-center">
                      <div className="text-blue-300 font-bold text-lg">
                        {formatTime(appointment.time)}
                      </div>
                    </div>
                    {getStatusIcon(appointment.status)}
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    appointment.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-300' :
                    appointment.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' :
                    appointment.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {appointment.status.toUpperCase()}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <h3 className="font-bold text-white text-lg">{appointment.customerName}</h3>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/90 text-sm">{appointment.address}</span>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex space-x-2 mt-4">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-500/20 border border-green-400 text-green-300 hover:bg-green-500/30 active:scale-95"
                    onClick={() => window.location.href = `tel:${appointment.phone}`}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-500/20 border border-blue-400 text-blue-300 hover:bg-blue-500/30 active:scale-95"
                    onClick={() => window.location.href = `https://maps.google.com/?q=${encodeURIComponent(appointment.address)}`}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                  
                  {appointment.status === 'scheduled' && (
                    <Button
                      size="sm"
                      className="flex-1 glass-btn-primary hover:glow-blue text-white active:scale-95"
                      onClick={() => onAppointmentAction && onAppointmentAction(appointment.id, 'confirm')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-blue-500/10 border border-blue-400/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No appointments today</h3>
            <p className="text-white/70 text-sm">
              {isToday ? 'Your schedule is clear for today' : 'No appointments scheduled for this date'}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Footer with Swipe Hint */}
      <div className="p-4 border-t border-blue-400/50 bg-blue-500/5">
        <div className="flex items-center justify-center space-x-2 text-white/60 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Swipe left/right to navigate dates</span>
          </div>
          <div className="w-px h-4 bg-blue-400/50"></div>
          <div className="flex items-center space-x-1">
            <Touch className="h-3 w-3" />
            <span>Tap for actions</span>
          </div>
        </div>
      </div>
    </div>
  );
}