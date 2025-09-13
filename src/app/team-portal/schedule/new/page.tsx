'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SmartBackButton } from '@/components/ui/SmartBreadcrumb';
import { useKeyboardShortcuts, createFormShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSave } from '@/hooks/useAutoSave';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Save,
  Phone,
  Building,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  devices?: Device[];
}

interface Device {
  id: string;
  make: string;
  model: string;
  location: string;
  device_type: string;
}

export default function NewSchedulePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerId: '',
    deviceId: '',
    date: '',
    time: '',
    serviceType: 'Annual Test',
    notes: '',
    duration: '60'
  });

  // Auto-save functionality
  const { saveNow, lastSavedTime, clearSaved } = useAutoSave(formData, {
    key: 'team-portal-new-appointment',
    interval: 30000,
    onSave: (data) => console.log('Auto-saved appointment draft:', data)
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load user info
        const userResponse = await fetch('/api/team/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserInfo(userData);
        }

        // Load customers
        const customersResponse = await fetch('/api/team/customers');
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          if (customersData.success) {
            setCustomers(customersData.customers || []);
          }
        }

        // Load available dates
        const datesResponse = await fetch('/api/appointments/available-dates');
        if (datesResponse.ok) {
          const datesData = await datesResponse.json();
          if (datesData.success) {
            setAvailableDates(datesData.dates || []);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const loadAvailableTimes = async (date: string) => {
    try {
      setLoadingTimes(true);
      const response = await fetch(`/api/appointments/available-times?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableTimes(data.availableSlots || []);
        }
      }
    } catch (error) {
      console.error('Error loading available times:', error);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.date || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          deviceId: formData.deviceId || null,
          date: formData.date,
          time: formData.time,
          serviceType: formData.serviceType,
          notes: formData.notes
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          clearSaved(); // Clear auto-saved data
          alert('Appointment scheduled successfully!');
          window.location.href = '/team-portal/schedule';
        } else {
          alert(`Failed to schedule appointment: ${result.error}`);
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to schedule appointment'}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-trigger time loading when date changes
    if (name === 'date' && value) {
      loadAvailableTimes(value);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id
    }));
    setStep(2);
  };

  const getFilteredCustomers = () => {
    if (!customerSearch) return customers;
    return customers.filter(customer => {
      const name = customer.company_name || `${customer.first_name} ${customer.last_name}`;
      return name.toLowerCase().includes(customerSearch.toLowerCase()) ||
             customer.phone.includes(customerSearch) ||
             customer.street_address.toLowerCase().includes(customerSearch.toLowerCase());
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <TeamPortalNavigation userInfo={userInfo} />
        <main className="p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
            <LoadingSpinner size="lg" color="blue" text="Loading appointment form..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={userInfo} />
      
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with Progress */}
          <div className="glass rounded-xl p-6 mb-6 border border-blue-400 glow-blue-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Link href="/team-portal/schedule">
                  <Button variant="ghost" className="text-blue-300 hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Schedule
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-white">New Appointment</h1>
                  <p className="text-white/90">Schedule a service appointment</p>
                </div>
              </div>
              {lastSavedTime && (
                <div className="text-sm text-white/80 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                  Auto-saved {lastSavedTime.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-4 mb-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= stepNum ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNum ? 'bg-blue-500' : 'bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-white/80">
              <span>Select Customer</span>
              <span>Choose Date & Time</span>
              <span>Confirm Details</span>
            </div>
          </div>

          {/* Step 1: Customer Selection */}
          {step === 1 && (
            <div className="glass rounded-xl p-6 border border-blue-400">
              <h2 className="text-2xl font-bold text-white mb-6">Select Customer</h2>
              
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-3 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or address..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Customer List */}
              <div className="max-h-96 overflow-y-auto space-y-3">
                {getFilteredCustomers().map((customer) => {
                  const displayName = customer.company_name || `${customer.first_name} ${customer.last_name}`;
                  return (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="p-4 border border-blue-500/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Building className="h-5 w-5 text-blue-400" />
                            <h3 className="font-bold text-white text-lg">{displayName}</h3>
                          </div>
                          <div className="flex items-center space-x-4 text-white/80">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{customer.street_address}, {customer.city}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phone}</span>
                            </div>
                          </div>
                          {customer.devices && customer.devices.length > 0 && (
                            <div className="mt-2 text-sm text-white/60">
                              {customer.devices.length} device{customer.devices.length !== 1 ? 's' : ''} registered
                            </div>
                          )}
                        </div>
                        <ArrowLeft className="h-5 w-5 text-blue-400 transform rotate-180" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {getFilteredCustomers().length === 0 && (
                <div className="text-center py-8 text-white/60">
                  <User className="h-12 w-12 mx-auto mb-4" />
                  <p>No customers found</p>
                  {customerSearch && <p className="text-sm">Try adjusting your search terms</p>}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && selectedCustomer && (
            <div className="glass rounded-xl p-6 border border-blue-400">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Choose Date & Time</h2>
                <Button variant="ghost" onClick={() => setStep(1)} className="text-blue-300 hover:text-white">
                  Change Customer
                </Button>
              </div>

              {/* Selected Customer Info */}
              <div className="bg-blue-500/10 border border-blue-400/50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-bold text-white">
                      {selectedCustomer.company_name || `${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
                    </p>
                    <p className="text-white/80 text-sm">{selectedCustomer.street_address}, {selectedCustomer.city}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Available Dates
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {availableDates.slice(0, 15).map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, date }))}
                        className={`p-3 rounded-xl text-center transition-all ${
                          formData.date === date
                            ? 'bg-blue-500 text-white border-2 border-blue-400'
                            : 'bg-black/50 border border-blue-500/50 text-white hover:border-blue-400 hover:bg-blue-500/10'
                        }`}
                      >
                        <div className="text-xs opacity-80">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="font-bold">
                          {new Date(date).getDate()}
                        </div>
                        <div className="text-xs opacity-80">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Available Times
                  </label>
                  {formData.date ? (
                    loadingTimes ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="sm" color="blue" text="Loading times..." />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableTimes.map((timeSlot) => (
                          <button
                            key={timeSlot.time}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, time: timeSlot.label }))}
                            className={`p-3 rounded-xl transition-all ${
                              formData.time === timeSlot.label
                                ? 'bg-blue-500 text-white border-2 border-blue-400'
                                : 'bg-black/50 border border-blue-500/50 text-white hover:border-blue-400 hover:bg-blue-500/10'
                            }`}
                          >
                            <Clock className="h-4 w-4 mx-auto mb-1" />
                            {timeSlot.label}
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-white/60">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>Select a date first</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Button */}
              {formData.date && formData.time && (
                <div className="flex justify-end mt-6">
                  <Button onClick={() => setStep(3)} className="glass-btn-primary hover:glow-blue text-white px-8 py-3">
                    Next: Confirm Details
                    <ArrowLeft className="h-4 w-4 ml-2 transform rotate-180" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && selectedCustomer && (
            <div className="glass rounded-xl p-6 border border-blue-400">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Confirm Appointment</h2>
                <Button variant="ghost" onClick={() => setStep(2)} className="text-blue-300 hover:text-white">
                  Change Date/Time
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Appointment Summary */}
                <div className="bg-blue-500/10 border border-blue-400/50 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-white text-lg mb-4">Appointment Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">
                          {selectedCustomer.company_name || `${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
                        </p>
                        <p className="text-white/80 text-sm">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">{selectedCustomer.street_address}</p>
                        <p className="text-white/80 text-sm">{selectedCustomer.city}, {selectedCustomer.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">
                          {formData.date ? new Date(formData.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not selected'}
                        </p>
                        <p className="text-white/80 text-sm">Service Date</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">{formData.time}</p>
                        <p className="text-white/80 text-sm">{formData.duration} minutes estimated</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device Selection */}
                {selectedCustomer.devices && selectedCustomer.devices.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      <FileText className="h-4 w-4 inline mr-2" />
                      Select Device (Optional)
                    </label>
                    <select
                      name="deviceId"
                      value={formData.deviceId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 bg-black/50 border border-blue-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">General service (no specific device)</option>
                      {selectedCustomer.devices.map(device => (
                        <option key={device.id} value={device.id}>
                          {device.make} {device.model} - {device.location}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Service Type
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 bg-black/50 border border-blue-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="Annual Test">Annual Testing</option>
                    <option value="Follow-up">Follow-up Visit</option>
                    <option value="Repair">Repair Service</option>
                    <option value="Installation">New Installation</option>
                    <option value="Consultation">Consultation</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Estimated Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 bg-black/50 border border-blue-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    <FileText className="h-4 w-4 inline mr-2" />
                    Special Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-3 bg-white/10 border border-blue-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Any special instructions, access notes, or specific requirements..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t border-blue-400/50">
                  <Button type="button" onClick={() => setStep(2)} variant="ghost" className="text-blue-300 hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="glass-btn-primary hover:glow-blue text-white px-8 py-3 font-semibold"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Schedule Appointment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}