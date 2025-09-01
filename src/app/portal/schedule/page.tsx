'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
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
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-slate-300 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center space-x-3">
                  <Logo width={160} height={128} />
                  <div>
                    <h1 className="text-lg font-bold text-slate-900">Fisher Backflows</h1>
                    <p className="text-xs text-slate-800">Customer Portal</p>
                  </div>
                </Link>
                <nav className="hidden md:flex space-x-1">
                  <Link href="/portal/dashboard" className="px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-300 font-medium transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2 inline" />
                    Back to Dashboard
                  </Link>
                </nav>
              </div>
              <div className="text-sm text-slate-800">
                Welcome, {mockCustomer.name}
              </div>
            </div>
          </div>
        </header>

        {/* Success Content */}
        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white border border-green-200 rounded-2xl p-12 text-center shadow-lg">
            <div className="inline-flex p-4 rounded-full bg-green-300 mb-8">
              <CheckCircle className="h-12 w-12 text-green-800" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Request Submitted!</h1>
            <p className="text-slate-800 text-xl mb-8 leading-relaxed">
              Thank you for scheduling your backflow test appointment.<br />
              We'll call you within 24 hours to confirm the details.
            </p>
            
            <div className="bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">What happens next?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-300 text-blue-800 text-sm font-bold flex items-center justify-center mt-0.5">1</div>
                  <p className="text-slate-700">Our team will review your request and available time slots</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-300 text-blue-800 text-sm font-bold flex items-center justify-center mt-0.5">2</div>
                  <p className="text-slate-700">We'll call you to confirm the appointment time and answer any questions</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-300 text-blue-800 text-sm font-bold flex items-center justify-center mt-0.5">3</div>
                  <p className="text-slate-700">Our certified technician will arrive at the scheduled time</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/portal/dashboard'}
                className="bg-blue-700 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 w-full sm:w-auto"
              >
                Back to Dashboard
              </Button>
              <div className="text-center">
                <p className="text-slate-800 mb-2">Need immediate assistance?</p>
                <Button 
                  onClick={() => window.location.href = 'tel:2532788692'}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call (253) 278-8692
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-300 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <Logo width={160} height={128} />
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Fisher Backflows</h1>
                  <p className="text-xs text-slate-800">Customer Portal</p>
                </div>
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/portal/dashboard" className="px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-300 font-medium transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2 inline" />
                  Dashboard
                </Link>
                <Link href="/portal/schedule" className="px-4 py-2 rounded-lg bg-blue-200 text-blue-700 border border-blue-200 font-medium">
                  Schedule Test
                </Link>
              </nav>
            </div>
            <div className="text-sm text-slate-800">
              Welcome, {mockCustomer.name}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Schedule Your Backflow Test</h1>
          <p className="text-slate-800 text-xl leading-relaxed">
            Quick and easy booking - we'll call you to confirm the details and exact time
          </p>
        </div>

        {/* Booking Form */}
        <div className="bg-white border border-slate-300 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-white px-8 py-6 border-b border-slate-300">
            <h2 className="text-xl font-bold text-slate-900">Book Your Appointment</h2>
            <p className="text-slate-800">Fill out the form below and we'll contact you within 24 hours</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Your Info */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-300">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-300 rounded-lg">
                      <User className="h-5 w-5 text-blue-800" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-800">Customer</p>
                      <p className="font-semibold text-slate-900">{mockCustomer.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-300 rounded-lg">
                      <Phone className="h-5 w-5 text-green-800" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-800">Phone</p>
                      <p className="font-semibold text-slate-900">{mockCustomer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-800">Location</p>
                      <p className="font-semibold text-slate-900">{mockCustomer.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar View */}
              <div>
                <label className="block text-slate-900 text-xl font-semibold mb-6">
                  <CalendarIcon className="h-6 w-6 inline mr-3 text-blue-800" />
                  Choose Your Preferred Date
                </label>
                
                {loadingDates ? (
                  <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-300">
                    <LoadingSpinner size="lg" color="blue" text="Loading available dates from your calendar..." />
                  </div>
                ) : availableDates.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-300">
                    <div className="inline-flex p-4 rounded-full bg-slate-50 mb-6">
                      <CalendarIcon className="h-8 w-8 text-slate-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">No Available Dates Found</h3>
                    <p className="text-slate-800 mb-6">Please call us directly to schedule your appointment</p>
                    <Button 
                      onClick={() => window.location.href = 'tel:2532788692'}
                      className="bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Call (253) 278-8692
                    </Button>
                  </div>
                ) : (
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <Calendar
                      availableDates={availableDates}
                      selectedDate={formData.preferredDate}
                      onDateSelect={handleDateSelect}
                      preferredTime={formData.preferredTime}
                    />
                  </div>
                )}
              </div>

              {/* Time Preference */}
              <div>
                <label className="block text-slate-900 text-xl font-semibold mb-6">
                  <Clock className="h-6 w-6 inline mr-3 text-blue-800" />
                  Preferred Time of Day
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                    formData.preferredTime === 'morning' 
                      ? 'border-blue-500 bg-blue-200' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="preferredTime"
                      value="morning"
                      checked={formData.preferredTime === 'morning'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className={`inline-flex p-3 rounded-full mb-4 ${
                        formData.preferredTime === 'morning' ? 'bg-blue-300' : 'bg-slate-300'
                      }`}>
                        <Clock className={`h-6 w-6 ${
                          formData.preferredTime === 'morning' ? 'text-blue-800' : 'text-slate-800'
                        }`} />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">Morning</h3>
                      <p className="text-sm text-slate-800 mb-3">7:00 AM - 12:00 PM</p>
                      {selectedDate && (
                        <p className="text-xs text-green-800 font-medium">
                          {selectedDate.availableSlots.filter(slot => slot.period === 'morning').length} slots available
                        </p>
                      )}
                    </div>
                    {formData.preferredTime === 'morning' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </label>

                  <label className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                    formData.preferredTime === 'afternoon' 
                      ? 'border-blue-500 bg-blue-200' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="preferredTime"
                      value="afternoon"
                      checked={formData.preferredTime === 'afternoon'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className={`inline-flex p-3 rounded-full mb-4 ${
                        formData.preferredTime === 'afternoon' ? 'bg-blue-300' : 'bg-slate-300'
                      }`}>
                        <Clock className={`h-6 w-6 ${
                          formData.preferredTime === 'afternoon' ? 'text-blue-800' : 'text-slate-800'
                        }`} />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">Afternoon</h3>
                      <p className="text-sm text-slate-800 mb-3">12:00 PM - 6:00 PM</p>
                      {selectedDate && (
                        <p className="text-xs text-green-800 font-medium">
                          {selectedDate.availableSlots.filter(slot => slot.period === 'afternoon').length} slots available
                        </p>
                      )}
                    </div>
                    {formData.preferredTime === 'afternoon' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </label>

                  <label className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                    formData.preferredTime === 'flexible' 
                      ? 'border-blue-500 bg-blue-200' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="preferredTime"
                      value="flexible"
                      checked={formData.preferredTime === 'flexible'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className={`inline-flex p-3 rounded-full mb-4 ${
                        formData.preferredTime === 'flexible' ? 'bg-blue-300' : 'bg-slate-300'
                      }`}>
                        <Clock className={`h-6 w-6 ${
                          formData.preferredTime === 'flexible' ? 'text-blue-800' : 'text-slate-800'
                        }`} />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">Flexible</h3>
                      <p className="text-sm text-slate-800 mb-3">Any time works</p>
                      {selectedDate && (
                        <p className="text-xs text-green-800 font-medium">
                          {selectedDate.availableSlots.length} total slots
                        </p>
                      )}
                    </div>
                    {formData.preferredTime === 'flexible' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {/* Show specific time slots for selected date */}
                {selectedDate && formData.preferredTime !== 'flexible' && (
                  <div className="mt-6 bg-slate-50 rounded-xl p-6 border border-slate-300">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      Available times on {selectedDate.dayOfWeek}:
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedDate.availableSlots
                        .filter(slot => slot.period === formData.preferredTime)
                        .map((slot, index) => (
                          <span key={index} className="px-3 py-2 bg-blue-300 text-blue-700 rounded-lg text-sm font-medium">
                            {slot.time}
                          </span>
                        ))}
                    </div>
                    <p className="text-xs text-slate-800">
                      💡 We'll call you to confirm the exact time that works best for both of us
                    </p>
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label htmlFor="specialInstructions" className="block text-slate-900 text-xl font-semibold mb-4">
                  Special Instructions <span className="text-slate-700 font-normal text-base">(Optional)</span>
                </label>
                <textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  placeholder="Gate codes, pet information, access instructions, or anything else we should know..."
                  rows={4}
                  className="w-full px-4 py-4 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                />
                <p className="text-sm text-slate-700 mt-2">
                  This helps our technicians prepare and ensures a smooth service experience
                </p>
              </div>

              {/* Submit Button */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-300">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.preferredDate}
                  className="w-full bg-blue-700 hover:bg-blue-700 disabled:bg-slate-50 text-white py-4 px-8 rounded-xl text-lg font-semibold shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-3">Submitting Request...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 mr-3" />
                      <span>Submit Appointment Request</span>
                    </div>
                  )}
                </Button>
                
                <div className="mt-4 text-center">
                  <p className="text-slate-800 text-sm mb-2">
                    ⚡ <strong>Quick Response:</strong> We'll call you within 24 hours to confirm
                  </p>
                  <p className="text-slate-700 text-xs">
                    By submitting this request, you agree to be contacted by Fisher Backflows
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Alternative Contact */}
        <div className="text-center mt-10">
          <div className="bg-slate-50 rounded-xl p-8 border border-slate-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Prefer to Call?</h3>
            <p className="text-slate-800 mb-6">Speak directly with our scheduling team</p>
            <Button 
              onClick={() => window.location.href = 'tel:2532788692'}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200"
            >
              <Phone className="h-5 w-5 mr-3" />
              Call (253) 278-8692
            </Button>
            <p className="text-slate-700 text-sm mt-3">
              Available Monday - Friday, 7:00 AM - 6:00 PM
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}