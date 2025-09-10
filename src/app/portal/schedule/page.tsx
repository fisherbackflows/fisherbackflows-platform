'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Wrench,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerData } from '@/hooks/useCustomerData';
import { useAutoSave } from '@/hooks/useAutoSave';
import { PortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

  async function loadAppointments() {
    try {
      setLoadingAppointments(true);
      const token = localStorage.getItem('portal_token');
      
      const response = await fetch(`/api/appointments?customerId=${customer.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
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

  async function bookAppointment() {
    if (!selectedDate || !selectedTime || !selectedDevice) {
      alert('Please select a date, time, and device');
      return;
    }

    try {
      // Find the selected slot
      const slot = availableSlots.find(s => 
        s.date === selectedDate && s.time === selectedTime
      );
      
      if (!slot) {
        alert('Invalid time slot selected');
        return;
      }
      
      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          customer_id: customer.id,
          device_id: selectedDevice.id,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          status: 'scheduled',
          notes: `Scheduled for ${slot.zone} zone - ${selectedDevice.location || selectedDevice.device_type}`
        })
        .select()
        .single();
      
      if (appointmentError) throw appointmentError;
      
      clearSaved(); // Clear auto-saved progress
      alert('Appointment booked successfully!');
      loadAppointments();
      setBookingStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedDevice(null);
    } catch (error) {
      console.error('Failed to book appointment:', error);
      alert('Failed to book appointment. Please try again.');
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
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />

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
                    className="btn-glow flex-1 px-4 py-2 rounded-2xl"
                  >
                    Confirm Booking
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
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="p-3 sm:p-4 rounded-xl border border-blue-400/50">
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
                        <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold text-center sm:text-left flex-shrink-0">
                          SCHEDULED
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}