'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Wrench,
  Save,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerData } from '@/hooks/useCustomerData';
import { useAutoSave } from '@/hooks/useAutoSave';
import { PortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function CustomerSchedulePage() {
  const { customer, loading, error } = useCustomerData();
  const supabase = createClientComponentClient();
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  
  // Auto-save booking progress
  const { saveNow, lastSavedTime, clearSaved } = useAutoSave(
    { selectedDevice, selectedDate, selectedTime, bookingStep },
    {
      key: 'customer-appointment-booking',
      interval: 15000,
      onSave: (data) => console.log('Auto-saved booking progress:', data)
    }
  );

  useEffect(() => {
    if (customer?.id) {
      loadAppointments();
      generateAvailableSlots();
    }
  }, [customer]);

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionError(false);
      toast.success('Connection restored');
      // Reload data when back online
      if (customer?.id) {
        loadAppointments();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionError(true);
      toast.error('No internet connection');
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [customer]);

  async function loadAppointments(retryCount = 0) {
    try {
      setLoadingAppointments(true);
      
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      const token = localStorage.getItem('portal_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`/api/appointments?customerId=${customer.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('portal_token');
          throw new Error('Session expired. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Please contact support.');
        }
        if (response.status >= 500) {
          throw new Error('Server error. Please try again in a moment.');
        }
        throw new Error(`Failed to load appointments (${response.status})`);
      }
      
      const data = await response.json();
      setAppointments(data.appointments || []);
      
    } catch (error) {
      console.error('Failed to load appointments:', error);
      
      if (error.name === 'AbortError') {
        if (retryCount < 2) {
          toast.error('Request timed out. Retrying...');
          return loadAppointments(retryCount + 1);
        } else {
          toast.error('Connection timeout. Please check your internet and try again.');
        }
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to load appointments');
      }
    } finally {
      setLoadingAppointments(false);
    }
  }

  function generateAvailableSlots() {
    const slots = [];
    const today = new Date();
    
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dayOfWeek = date.getDay();
      
      // Determine zone based on day of week
      let zone = '';
      let isAvailable = false;
      
      // Monday-Tuesday (1-2): North Puyallup
      // Wednesday-Friday (3-5): South Puyallup  
      // Saturday-Sunday (0,6): North Puyallup
      if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 2) {
        zone = 'North Puyallup';
        isAvailable = true;
      } else if (dayOfWeek >= 3 && dayOfWeek <= 5) {
        zone = 'South Puyallup';
        isAvailable = true;
      }
      
      if (isAvailable) {
        // Weekend hours: 7am-7pm
        // Weekday hours: 5pm-10pm
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const startHour = isWeekend ? 7 : 17;
        const endHour = isWeekend ? 19 : 22;
        
        for (let hour = startHour; hour < endHour; hour++) {
          slots.push({
            date: date.toISOString().split('T')[0],
            time: `${hour.toString().padStart(2, '0')}:00`,
            zone: zone,
            available: true
          });
        }
      }
    }
    
    setAvailableSlots(slots);
  }

  function getSlotsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.filter(slot => slot.date === dateStr);
  }

  function getAvailableDates() {
    const dates = new Set();
    availableSlots.forEach(slot => {
      dates.add(slot.date);
    });
    return Array.from(dates).sort();
  }

  async function cancelAppointment(appointmentId: string, reason: string = '') {
    if (!customer?.id) {
      toast.error('Customer information not found');
      return;
    }

    const cancelToast = toast.loading('Cancelling appointment...');

    try {
      const response = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          customerId: customer.id,
          reason: reason.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.canCancel === false) {
          toast.error(`Cannot cancel: ${result.error}`, { id: cancelToast });
          return;
        }
        throw new Error(result.error || 'Failed to cancel appointment');
      }

      toast.success(result.message || 'Appointment cancelled successfully', { 
        id: cancelToast,
        duration: 6000 
      });

      // Refresh appointments list
      await loadAppointments();
      
      // Close modal and reset state
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);

    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error('Failed to cancel appointment. Please try again.', { id: cancelToast });
    }
  }

  async function rescheduleAppointment(appointmentId: string, newDate: string, newTime: string, reason: string = '') {
    if (!customer?.id) {
      toast.error('Customer information not found');
      return;
    }

    const rescheduleToast = toast.loading('Rescheduling appointment...');

    try {
      const response = await fetch('/api/appointments/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          customerId: customer.id,
          newDate,
          newTime,
          reason: reason.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          toast.error(result.error, { id: rescheduleToast });
          return;
        }
        if (response.status === 409) {
          toast.error(result.error, { id: rescheduleToast, duration: 6000 });
          if (result.conflictDetails?.suggestedAlternatives?.length > 0) {
            const alternatives = result.conflictDetails.suggestedAlternatives;
            const altText = alternatives.slice(0, 2).map(alt => 
              `${new Date(alt.date).toLocaleDateString()} at ${alt.time}`
            ).join(', ');
            toast(`Try these times: ${altText}`, {
              duration: 10000,
              icon: '💡',
            });
          }
          return;
        }
        throw new Error(result.error || 'Failed to reschedule appointment');
      }

      toast.success(result.message || 'Appointment rescheduled successfully', { 
        id: rescheduleToast,
        duration: 6000 
      });

      // Refresh appointments list
      await loadAppointments();
      
      // Close modal and reset state
      setShowRescheduleModal(false);
      setRescheduleReason('');
      setRescheduleDate('');
      setRescheduleTime('');
      setSelectedAppointment(null);

    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      toast.error('Failed to reschedule appointment. Please try again.', { id: rescheduleToast });
    }
  }

  function canModifyAppointment(appointment) {
    const appointmentDateTime = new Date(`${appointment.appointment_date || appointment.date}T${appointment.appointment_time || appointment.time}`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Must be at least 24 hours in advance
    return hoursDifference >= 24 && 
           appointment.status !== 'cancelled' && 
           appointment.status !== 'completed';
  }

  async function bookAppointment(retryCount = 0) {
    if (!selectedDate || !selectedTime || !selectedDevice) {
      toast.error('Please select a date, time, and device');
      return;
    }

    // Validate customer data
    if (!customer?.id) {
      toast.error('Customer information not found. Please refresh and try again.');
      return;
    }

    const bookingToast = toast.loading('Booking your appointment...');

    try {
      // Check network connectivity
      if (!navigator.onLine) {
        toast.error('No internet connection. Please check your network and try again.', { id: bookingToast });
        return;
      }

      // Find the selected slot to get zone info
      const slot = availableSlots.find(s => 
        s.date === selectedDate && s.time === selectedTime
      );
      
      if (!slot) {
        toast.error('Invalid time slot selected. Please select another time.', { id: bookingToast });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for booking
      
      // Use secure booking API
      const response = await fetch('/api/appointments/book-secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          deviceId: selectedDevice.id,
          date: selectedDate,
          time: selectedTime,
          zone: slot.zone,
          notes: `Device: ${selectedDevice.location || selectedDevice.device_type}`
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          // Conflict - show alternatives
          toast.error(result.error, { id: bookingToast, duration: 6000 });
          if (result.conflictDetails?.suggestedAlternatives?.length > 0) {
            const alternatives = result.conflictDetails.suggestedAlternatives;
            const altText = alternatives.slice(0, 2).map(alt => 
              `${new Date(alt.date).toLocaleDateString()} at ${alt.time}`
            ).join(', ');
            toast(`Alternative times: ${altText}`, {
              duration: 10000,
              icon: '💡',
            });
          }
        } else if (response.status === 429) {
          toast.error('Too many booking attempts. Please wait a moment and try again.', { id: bookingToast });
        } else if (response.status === 404) {
          toast.error('Customer or device not found. Please refresh and try again.', { id: bookingToast });
        } else if (response.status >= 500) {
          toast.error('Server error. Our team has been notified. Please try again in a moment.', { id: bookingToast });
        } else {
          toast.error(result.error || `Booking failed (${response.status})`, { id: bookingToast });
        }
        return;
      }
      
      // Success!
      clearSaved(); // Clear auto-saved progress
      toast.success(result.message || 'Appointment booked successfully!', { 
        id: bookingToast,
        duration: 6000 
      });
      
      // Refresh appointments and reset form
      await loadAppointments();
      setBookingStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedDevice(null);
      
    } catch (error) {
      console.error('Failed to book appointment:', error);
      
      if (error.name === 'AbortError') {
        if (retryCount < 1) {
          toast.error('Request timed out. Retrying...', { id: bookingToast });
          return bookAppointment(retryCount + 1);
        } else {
          toast.error('Booking timeout. Please try again.', { id: bookingToast });
        }
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.', { id: bookingToast });
      } else {
        toast.error('Unexpected error occurred. Please try again.', { id: bookingToast });
      }
    }
  }

  if (loading || loadingAppointments) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading scheduling information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Schedule</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-glow">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date || apt.date) >= new Date()
  );
  
  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date || apt.date) < new Date()
  );

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center glass p-8 rounded-2xl">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-white/80 mb-4">
            The scheduling system encountered an error. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()} className="btn-glow">
            Refresh Page
          </Button>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-black">
        <div className="fixed inset-0 bg-grid opacity-10" />
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />

        {/* Connection Status Banner */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>No internet connection - some features may be limited</span>
            </div>
          </div>
        )}

        <PortalNavigation userInfo={{
          name: customer?.name,
          email: customer?.email,
          accountNumber: customer?.accountNumber
        }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white">Schedule Service</h1>
          <p className="text-white/90 text-base sm:text-lg">Book appointments for your backflow testing needs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Booking Section */}
          <div className="glass rounded-2xl p-4 sm:p-6 border border-blue-400">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Book New Appointment</h2>
              {lastSavedTime && (
                <div className="text-sm text-white/60 flex items-center">
                  <Save className="h-3 w-3 mr-1" />
                  Auto-saved {lastSavedTime.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            {/* Step 1: Select Device */}
            {bookingStep === 1 && (
              <div>
                <h3 className="text-lg font-bold text-blue-200 mb-4">Step 1: Select Device</h3>
                <div className="space-y-3">
                  {customer?.devices?.map((device) => (
                    <div
                      key={device.id}
                      onClick={() => {
                        setSelectedDevice(device);
                        setBookingStep(2);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedDevice?.id === device.id
                          ? 'border-blue-400 bg-blue-500/10 glow-blue-sm'
                          : 'border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{device.make} {device.model}</p>
                          <p className="text-sm text-white/60">{device.location}</p>
                        </div>
                        <CheckCircle className={`h-5 w-5 ${
                          selectedDevice?.id === device.id ? 'text-blue-400' : 'text-white/20'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Step 2: Select Date */}
            {bookingStep === 2 && (
              <div>
                <h3 className="text-lg font-bold text-blue-200 mb-4">Step 2: Select Date</h3>
                
                {/* Zone Info */}
                <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-400/30">
                  <p className="text-sm text-blue-200 mb-2">Service Zones:</p>
                  <div className="text-xs text-white/60 mb-1">
                    <span className="font-bold">North Puyallup:</span> Sat, Sun, Mon, Tue
                  </div>
                  <div className="text-xs text-white/60">
                    <span className="font-bold">South Puyallup:</span> Wed, Thu, Fri
                  </div>
                  <div className="text-xs text-white/60 mt-2">
                    <span className="font-bold">Hours:</span> Weekdays 5pm-10pm, Weekends 7am-7pm
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getAvailableDates().slice(0, 12).map((date) => {
                    const daySlots = getSlotsForDate(new Date(date));
                    const zone = daySlots[0]?.zone || '';
                    const dateObj = new Date(date);
                    return (
                      <Button
                        key={date}
                        onClick={() => {
                          setSelectedDate(date);
                          setBookingStep(3);
                        }}
                        className={`p-3 rounded-xl ${
                          selectedDate === date
                            ? 'glass-btn-primary glow-blue-sm'
                            : 'btn-glass'
                        }`}
                      >
                        <div className="text-center">
                          <p className="text-xs">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                          <p className="font-bold">{dateObj.getDate()}</p>
                          <p className="text-xs">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</p>
                          {zone && <p className="text-xs text-blue-300 mt-1">{zone.split(' ')[0]}</p>}
                        </div>
                      </Button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => setBookingStep(1)}
                  className="btn-glass mt-4 px-4 py-2 rounded-2xl"
                >
                  Back
                </Button>
              </div>
            )}
            
            {/* Step 3: Select Time */}
            {bookingStep === 3 && (
              <div>
                <h3 className="text-lg font-bold text-blue-200 mb-4">Step 3: Select Time</h3>
                {selectedDate && (
                  <>
                    {getSlotsForDate(new Date(selectedDate)).length > 0 && (
                      <div className="mb-3 flex items-center text-sm text-blue-200">
                        <MapPin className="h-4 w-4 mr-1" />
                        Zone: {getSlotsForDate(new Date(selectedDate))[0].zone}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {getSlotsForDate(new Date(selectedDate)).map((slot, idx) => {
                        const hour = parseInt(slot.time.split(':')[0]);
                        const displayTime = hour > 12 ? 
                          `${hour - 12}:00 PM` : 
                          hour === 12 ? '12:00 PM' : 
                          `${hour}:00 AM`;
                        return (
                          <Button
                            key={idx}
                            onClick={() => {
                              setSelectedTime(slot.time);
                              setBookingStep(4);
                            }}
                            className={`p-3 rounded-xl ${
                              selectedTime === slot.time
                                ? 'glass-btn-primary glow-blue-sm'
                                : 'btn-glass'
                            }`}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {displayTime}
                          </Button>
                        );
                      })}
                    </div>
                    {getSlotsForDate(new Date(selectedDate)).length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-blue-400/50 mx-auto mb-4" />
                        <p className="text-white/60 mb-2">No available times for this date</p>
                        <p className="text-sm text-white/40">Please select a different date</p>
                      </div>
                    )}
                  </>
                )}
                <Button
                  onClick={() => setBookingStep(2)}
                  className="btn-glass mt-4 px-4 py-2 rounded-2xl"
                >
                  Back
                </Button>
              </div>
            )}
            
            {/* Step 4: Confirm */}
            {bookingStep === 4 && (
              <div>
                <h3 className="text-lg font-bold text-blue-200 mb-4">Confirm Appointment</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <Wrench className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-white/60">Device</p>
                      <p className="font-bold text-white">{selectedDevice?.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-white/60">Date</p>
                      <p className="font-bold text-white">
                        {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-white/60">Time</p>
                      <p className="font-bold text-white">
                        {selectedTime ? (() => {
                          const hour = parseInt(selectedTime.split(':')[0]);
                          return hour > 12 ? `${hour - 12}:00 PM` : 
                                 hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
                        })() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-white/60">Service Zone</p>
                      <p className="font-bold text-white">
                        {selectedDate && selectedTime ? (() => {
                          const slot = availableSlots.find(s => 
                            s.date === selectedDate && s.time === selectedTime
                          );
                          return slot?.zone || 'N/A';
                        })() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setBookingStep(3)}
                    className="btn-glass flex-1 px-4 py-2 rounded-2xl"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={bookAppointment}
                    disabled={!isOnline}
                    className={`btn-glow flex-1 px-4 py-2 rounded-2xl ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!isOnline ? 'Internet connection required to book appointments' : ''}
                  >
                    {!isOnline ? 'Offline - Cannot Book' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Appointments List */}
          <div className="glass rounded-2xl p-4 sm:p-6 border border-blue-400">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Your Appointments</h2>
            
            {/* Upcoming */}
            {upcomingAppointments.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg font-bold text-blue-200 mb-3">Upcoming</h3>
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => {
                    const canModify = canModifyAppointment(apt);
                    const appointmentDateTime = new Date(`${apt.appointment_date || apt.date}T${apt.appointment_time || apt.time}`);
                    const hoursUntil = Math.round((appointmentDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60));
                    
                    return (
                      <div key={apt.id} className="p-3 sm:p-4 rounded-xl border border-blue-400/50">
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white truncate">{apt.service_type || 'Annual Test'}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-1 gap-1">
                                <span className="text-sm text-white/60 flex items-center">
                                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{new Date(apt.appointment_date || apt.date).toLocaleDateString()}</span>
                                </span>
                                <span className="text-sm text-white/60 flex items-center">
                                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{apt.appointment_time || apt.time || 'TBD'}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`px-3 py-1 rounded-full text-xs font-bold text-center flex-shrink-0 ${
                                apt.status === 'scheduled' ? 'bg-blue-500/20 text-blue-200' :
                                apt.status === 'confirmed' ? 'bg-green-500/20 text-green-200' :
                                apt.status === 'cancelled' ? 'bg-red-500/20 text-red-200' :
                                'bg-yellow-500/20 text-yellow-200'
                              }`}>
                                {apt.status?.toUpperCase() || 'SCHEDULED'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
                            {canModify ? (
                              <>
                                <Button
                                  onClick={() => {
                                    setSelectedAppointment(apt);
                                    setShowRescheduleModal(true);
                                  }}
                                  size="sm"
                                  className="btn-glass text-blue-300 hover:bg-blue-500/10 flex-1"
                                  disabled={!isOnline}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Reschedule
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedAppointment(apt);
                                    setShowCancelModal(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-400/50 text-red-300 hover:bg-red-500/10 flex-1"
                                  disabled={!isOnline}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <div className="text-xs text-white/60 text-center p-2">
                                {apt.status === 'cancelled' ? 'This appointment has been cancelled' :
                                 apt.status === 'completed' ? 'This appointment has been completed' :
                                 hoursUntil < 24 ? `Cannot modify - less than 24 hours remaining (${hoursUntil}h)` :
                                 'Cannot modify this appointment'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Past */}
            {pastAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white/60 mb-3">Past Appointments</h3>
                <div className="space-y-3 opacity-60">
                  {pastAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="p-4 rounded-xl border border-blue-400/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white/80">{apt.service_type || 'Annual Test'}</p>
                          <p className="text-sm text-white/50">
                            {new Date(apt.appointment_date || apt.date).toLocaleDateString()}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-400/60" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {appointments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-blue-400/50 mx-auto mb-4" />
                <p className="text-white/60">No appointments scheduled</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-red-400 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white">Cancel Appointment</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-red-300 mb-2">Appointment Details</h4>
                <div className="space-y-1 text-sm text-white/80">
                  <div>Date: {new Date(selectedAppointment.appointment_date || selectedAppointment.date).toLocaleDateString()}</div>
                  <div>Time: {selectedAppointment.appointment_time || selectedAppointment.time}</div>
                  <div>Service: {selectedAppointment.service_type || 'Annual Test'}</div>
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you're cancelling..."
                  rows={3}
                  className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3">
                <p className="text-yellow-200 text-sm">
                  ⚠️ Appointments can only be cancelled at least 24 hours in advance. 
                  This cancellation cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/20 flex space-x-3">
              <Button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedAppointment(null);
                }}
                className="flex-1 btn-glass"
              >
                Keep Appointment
              </Button>
              <Button
                onClick={() => cancelAppointment(selectedAppointment.id, cancelReason)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Cancel Appointment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-blue-400 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white">Reschedule Appointment</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-300 mb-2">Current Appointment</h4>
                <div className="space-y-1 text-sm text-white/80">
                  <div>Date: {new Date(selectedAppointment.appointment_date || selectedAppointment.date).toLocaleDateString()}</div>
                  <div>Time: {selectedAppointment.appointment_time || selectedAppointment.time}</div>
                  <div>Service: {selectedAppointment.service_type || 'Annual Test'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    New Time
                  </label>
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">Select time</option>
                    {rescheduleDate && (() => {
                      const date = new Date(rescheduleDate);
                      const dayOfWeek = date.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const isNorthPuyallup = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 2;
                      const isSouthPuyallup = dayOfWeek >= 3 && dayOfWeek <= 5;
                      
                      if (!isNorthPuyallup && !isSouthPuyallup) return null;
                      
                      const startHour = isWeekend ? 7 : 17;
                      const endHour = isWeekend ? 19 : 22;
                      const timeOptions = [];
                      
                      for (let hour = startHour; hour < endHour; hour++) {
                        const timeValue = `${hour.toString().padStart(2, '0')}:00`;
                        const displayTime = hour > 12 ? `${hour - 12}:00 PM` : 
                                           hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
                        timeOptions.push(
                          <option key={timeValue} value={timeValue}>
                            {displayTime}
                          </option>
                        );
                      }
                      return timeOptions;
                    })()}
                  </select>
                </div>
              </div>

              {rescheduleDate && (
                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
                  <p className="text-green-200 text-sm">
                    Service Zone: {(() => {
                      const date = new Date(rescheduleDate);
                      const dayOfWeek = date.getDay();
                      if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 2) {
                        return 'North Puyallup';
                      } else if (dayOfWeek >= 3 && dayOfWeek <= 5) {
                        return 'South Puyallup';
                      }
                      return 'Invalid date selected';
                    })()}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Reason for rescheduling (optional)
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Please let us know why you're rescheduling..."
                  rows={2}
                  className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3">
                <p className="text-yellow-200 text-sm">
                  ⚠️ Appointments can only be rescheduled at least 24 hours in advance. 
                  Please ensure the new time is available.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/20 flex space-x-3">
              <Button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleReason('');
                  setRescheduleDate('');
                  setRescheduleTime('');
                  setSelectedAppointment(null);
                }}
                className="flex-1 btn-glass"
              >
                Cancel
              </Button>
              <Button
                onClick={() => rescheduleAppointment(selectedAppointment.id, rescheduleDate, rescheduleTime, rescheduleReason)}
                disabled={!rescheduleDate || !rescheduleTime}
                className={`flex-1 btn-glow ${!rescheduleDate || !rescheduleTime ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />
      </div>
    </ErrorBoundary>
  );
}