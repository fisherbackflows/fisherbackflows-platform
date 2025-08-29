'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/portal/Navigation';
import Calendar from '@/components/ui/Calendar';

// Mock customer data
const mockCustomer = {
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '(253) 555-0123',
  address: '123 Main St, Tacoma, WA 98401'
};

interface AvailableDate {
  date: string;
  dayOfWeek: string;
  availableSlots: Array<{
    time: string;
    period: 'morning' | 'afternoon';
  }>;
}

export default function SchedulePage() {
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: 'morning',
    contactMethod: 'phone',
    specialInstructions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [selectedDate, setSelectedDate] = useState<AvailableDate | null>(null);

  // Fetch available dates from your Google Calendar
  useEffect(() => {
    async function fetchAvailableDates() {
      try {
        setLoadingDates(true);
        const response = await fetch('/api/calendar/available-dates');
        const data = await response.json();
        
        if (data.success) {
          setAvailableDates(data.availableDates);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
      } finally {
        setLoadingDates(false);
      }
    }

    fetchAvailableDates();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update selected date when date changes
    if (name === 'preferredDate') {
      const selected = availableDates.find(date => date.date === value);
      setSelectedDate(selected || null);
    }
  };

  const handleDateSelect = (date: string) => {
    setFormData(prev => ({ ...prev, preferredDate: date }));
    const selected = availableDates.find(availableDate => availableDate.date === date);
    setSelectedDate(selected || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Extract customer ID from account number (for demo, using mock customer ID)
      const customerId = '1'; // In real app, get this from auth context
      
      // Create appointment
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          serviceType: 'Annual Test',
          date: formData.preferredDate,
          time: formData.preferredTime === 'morning' ? '09:00' : '14:00', // Default times
          duration: 60,
          deviceLocation: mockCustomer.address,
          notes: formData.specialInstructions
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setIsSubmitted(true);
        
        // Show success message with appointment details
        console.log('Appointment created:', result.appointment);
        console.log('Calendar event ID:', result.calendarEventId);
      } else {
        throw new Error(result.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed inset-0 bg-grid opacity-10" />
        <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
        
        <Navigation customerName={mockCustomer.name} accountNumber="FB001" />
        
        <div className="max-w-2xl mx-auto px-4 py-16 text-center relative z-10">
          <div className="glass-blue rounded-3xl p-12 glow-blue">
            <div className="glass rounded-full p-6 mx-auto mb-6 w-20 h-20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-green-400">Request Submitted!</h1>
            <p className="text-white/80 text-lg mb-8">
              We'll call you within 24 hours to confirm your appointment details.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/portal/dashboard'}
                className="btn-glow py-3 px-8 rounded-lg w-full"
              >
                Back to Dashboard
              </Button>
              <Button 
                onClick={() => window.location.href = 'tel:2532788692'}
                className="btn-glass py-3 px-8 rounded-lg w-full"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Now: (253) 278-8692
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />

      <Navigation customerName={mockCustomer.name} accountNumber="FB001" />

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">Schedule Your Test</h1>
          <p className="text-white/70 text-lg">
            Quick and easy booking - we'll call you to confirm details
          </p>
        </div>

        {/* Simple Booking Form */}
        <div className="glass rounded-3xl p-8 glow-blue-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Your Info */}
            <div className="glass-blue rounded-2xl p-6">
              <h2 className="text-lg font-bold text-blue-400 mb-4">Your Information</h2>
              <div className="space-y-3 text-sm text-white/80">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-3 text-blue-400" />
                  {mockCustomer.name}
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-blue-400" />
                  {mockCustomer.phone}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-3 text-blue-400" />
                  {mockCustomer.address}
                </div>
              </div>
            </div>

            {/* Calendar View */}
            <div>
              <label className="block text-white/80 text-lg font-medium mb-4">
                Choose from your available dates
              </label>
              
              {loadingDates ? (
                <div className="glass-blue rounded-xl p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-white/70">Loading available dates from your calendar...</p>
                </div>
              ) : availableDates.length === 0 ? (
                <div className="glass-blue rounded-xl p-8 text-center">
                  <div className="h-12 w-12 text-white/30 mx-auto mb-4 flex items-center justify-center">
                    📅
                  </div>
                  <p className="text-white/70 mb-4">No available dates found</p>
                  <p className="text-white/50 text-sm">Please call us to schedule: (253) 278-8692</p>
                </div>
              ) : (
                <Calendar
                  availableDates={availableDates}
                  selectedDate={formData.preferredDate}
                  onDateSelect={handleDateSelect}
                  preferredTime={formData.preferredTime}
                />
              )}
            </div>

            {/* Time Preference */}
            <div>
              <label className="block text-white/80 text-lg font-medium mb-3">
                What time works best?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`glass-blue rounded-xl p-4 cursor-pointer transition-all ${formData.preferredTime === 'morning' ? 'ring-2 ring-blue-400' : ''}`}>
                  <input
                    type="radio"
                    name="preferredTime"
                    value="morning"
                    checked={formData.preferredTime === 'morning'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <p className="font-medium">Morning</p>
                    <p className="text-sm text-white/60">7AM - 12PM</p>
                    {selectedDate && (
                      <p className="text-xs text-green-400 mt-1">
                        {selectedDate.availableSlots.filter(slot => slot.period === 'morning').length} slots available
                      </p>
                    )}
                  </div>
                </label>
                <label className={`glass-blue rounded-xl p-4 cursor-pointer transition-all ${formData.preferredTime === 'afternoon' ? 'ring-2 ring-blue-400' : ''}`}>
                  <input
                    type="radio"
                    name="preferredTime"
                    value="afternoon"
                    checked={formData.preferredTime === 'afternoon'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <p className="font-medium">Afternoon</p>
                    <p className="text-sm text-white/60">12PM - 6PM</p>
                    {selectedDate && (
                      <p className="text-xs text-green-400 mt-1">
                        {selectedDate.availableSlots.filter(slot => slot.period === 'afternoon').length} slots available
                      </p>
                    )}
                  </div>
                </label>
                <label className={`glass-blue rounded-xl p-4 cursor-pointer transition-all ${formData.preferredTime === 'flexible' ? 'ring-2 ring-blue-400' : ''}`}>
                  <input
                    type="radio"
                    name="preferredTime"
                    value="flexible"
                    checked={formData.preferredTime === 'flexible'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <p className="font-medium">Flexible</p>
                    <p className="text-sm text-white/60">Anytime</p>
                    {selectedDate && (
                      <p className="text-xs text-green-400 mt-1">
                        {selectedDate.availableSlots.length} total slots
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {/* Show specific time slots for selected date */}
              {selectedDate && formData.preferredTime !== 'flexible' && (
                <div className="mt-4 glass-darker rounded-xl p-4">
                  <p className="text-white/70 text-sm mb-3">Available times on {selectedDate.dayOfWeek}:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDate.availableSlots
                      .filter(slot => slot.period === formData.preferredTime)
                      .map((slot, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                          {slot.time}
                        </span>
                      ))}
                  </div>
                  <p className="text-white/50 text-xs mt-2">
                    We'll confirm the exact time when we call you
                  </p>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-white/80 text-lg font-medium mb-3">
                Special instructions (optional)
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                placeholder="Gate codes, pet info, access instructions, etc."
                rows={3}
                className="input-glass w-full px-4 py-4 rounded-xl text-white placeholder-white/40 resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-glow py-4 text-xl font-bold rounded-2xl hover-glow"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-5 w-5 mr-3" />
                  Request Test Appointment
                </>
              )}
            </Button>
            
            <p className="text-center text-white/60 text-sm">
              ⚡ We'll call you within 24 hours to confirm your appointment
            </p>
          </form>
        </div>

        {/* Or Call */}
        <div className="text-center mt-8">
          <p className="text-white/60 mb-4">Prefer to call?</p>
          <Button 
            onClick={() => window.location.href = 'tel:2532788692'}
            className="btn-glass py-3 px-6 rounded-xl"
          >
            <Phone className="h-5 w-5 mr-2" />
            (253) 278-8692
          </Button>
        </div>
      </div>
    </div>
  );
}