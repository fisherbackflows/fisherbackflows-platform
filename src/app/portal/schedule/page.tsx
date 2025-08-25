'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface TimeSlot {
  time: string;
  available: boolean;
  technicianName?: string;
}

interface AppointmentRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: 'test' | 'repair' | 'installation' | 'inspection';
  deviceCount: number;
  deviceTypes: string[];
  urgency: 'routine' | 'urgent' | 'emergency';
  preferredTechnician: string;
  notes: string;
  contactMethod: 'phone' | 'email' | 'text';
}

export default function SchedulePage() {
  const [step, setStep] = useState<'details' | 'datetime' | 'confirm' | 'success'>('details');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<AppointmentRequest>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    appointmentDate: '',
    appointmentTime: '',
    serviceType: 'test',
    deviceCount: 1,
    deviceTypes: [],
    urgency: 'routine',
    preferredTechnician: '',
    notes: '',
    contactMethod: 'email'
  });

  const serviceTypes = [
    { value: 'test', label: 'Annual Testing', duration: '45 min', price: '$85' },
    { value: 'repair', label: 'Device Repair', duration: '60-90 min', price: '$150+' },
    { value: 'installation', label: 'New Installation', duration: '2-3 hrs', price: '$450+' },
    { value: 'inspection', label: 'Pre-Purchase Inspection', duration: '30 min', price: '$65' }
  ];

  const deviceTypeOptions = [
    'RP (Reduced Pressure)',
    'DC (Double Check)',
    'PVB (Pressure Vacuum Breaker)',
    'DCDA (Double Check Detector Assembly)',
    'SVB (Spill-Resistant Vacuum Breaker)'
  ];

  const technicians = [
    'John Fisher (Owner/Lead Technician)',
    'Mike Johnson (Senior Technician)',
    'Sarah Wilson (Certified Technician)',
    'No Preference'
  ];

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const generateTimeSlots = (date: Date) => {
    setLoading(true);
    
    // Simulate API call to get available slots
    setTimeout(() => {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const slots: TimeSlot[] = [];
      const startHour = isWeekend ? 8 : 7;
      const endHour = isWeekend ? 16 : 18;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const available = Math.random() > 0.3; // 70% availability simulation
          
          slots.push({
            time,
            available,
            technicianName: available ? technicians[Math.floor(Math.random() * technicians.length)] : undefined
          });
        }
      }
      
      setAvailableSlots(slots);
      setLoading(false);
    }, 500);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      appointmentDate: date.toISOString().split('T')[0]
    }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({
      ...prev,
      appointmentTime: time
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Simulate appointment booking
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Booking appointment:', formData);
      setStep('success');
    } catch (error) {
      alert('Error booking appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 1; i <= 14; i++) { // Show next 2 weeks
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const selectedService = serviceTypes.find(s => s.value === formData.serviceType);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            {step !== 'details' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (step === 'success') {
                    window.location.href = '/portal/dashboard';
                  } else if (step === 'confirm') {
                    setStep('datetime');
                  } else {
                    setStep('details');
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <Link href="/" className="flex items-center space-x-2">
                <div className="text-xl font-bold text-gray-900">
                  Fisher <span className="text-blue-600">Backflows</span>
                </div>
              </Link>
              <div className="text-sm text-gray-600">Schedule Service</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[
            { key: 'details', label: 'Service Details' },
            { key: 'datetime', label: 'Date & Time' },
            { key: 'confirm', label: 'Confirm' },
            { key: 'success', label: 'Complete' }
          ].map((stepItem, index) => (
            <div key={stepItem.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepItem.key ? 'bg-blue-600 text-white' :
                ['details', 'datetime', 'confirm', 'success'].indexOf(step) > index ? 'bg-green-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {['details', 'datetime', 'confirm', 'success'].indexOf(step) > index ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600 hidden sm:inline">
                {stepItem.label}
              </span>
              {index < 3 && (
                <div className={`w-8 h-1 mx-4 ${
                  ['details', 'datetime', 'confirm', 'success'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Service Details Step */}
        {step === 'details' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Details</h2>
              
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        className="form-input"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="(253) 555-0123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Contact Method
                      </label>
                      <select
                        className="form-select"
                        value={formData.contactMethod}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value as any }))}
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone Call</option>
                        <option value="text">Text Message</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Address *
                    </label>
                    <textarea
                      required
                      className="form-textarea"
                      rows={3}
                      value={formData.customerAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                      placeholder="123 Main Street, Tacoma, WA 98402"
                    />
                  </div>
                </div>

                {/* Service Type */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {serviceTypes.map(service => (
                      <label
                        key={service.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.serviceType === service.value
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="serviceType"
                          value={service.value}
                          checked={formData.serviceType === service.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value as any }))}
                          className="sr-only"
                        />
                        <div className="font-semibold">{service.label}</div>
                        <div className="text-sm text-gray-600">{service.duration}</div>
                        <div className="text-sm font-medium text-green-600">{service.price}</div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Device Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Devices
                      </label>
                      <select
                        className="form-select"
                        value={formData.deviceCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, deviceCount: parseInt(e.target.value) }))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
                          <option key={count} value={count}>{count} device{count > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Device Types (if known)
                      </label>
                      <div className="space-y-2">
                        {deviceTypeOptions.map(deviceType => (
                          <label key={deviceType} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.deviceTypes.includes(deviceType)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    deviceTypes: [...prev.deviceTypes, deviceType]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    deviceTypes: prev.deviceTypes.filter(type => type !== deviceType)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{deviceType}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgency Level
                      </label>
                      <select
                        className="form-select"
                        value={formData.urgency}
                        onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                      >
                        <option value="routine">Routine (Standard scheduling)</option>
                        <option value="urgent">Urgent (Within 1-2 days)</option>
                        <option value="emergency">Emergency (Same day if possible)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Technician
                      </label>
                      <select
                        className="form-select"
                        value={formData.preferredTechnician}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredTechnician: e.target.value }))}
                      >
                        {technicians.map(tech => (
                          <option key={tech} value={tech}>{tech}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        className="form-textarea"
                        rows={4}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any special instructions, access requirements, or additional information..."
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setStep('datetime')}
                  disabled={!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.customerAddress}
                  className="w-full"
                >
                  Continue to Date & Time
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Date & Time Step */}
        {step === 'datetime' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date & Time</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Date Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Dates</h3>
                  <div className="space-y-2">
                    {getNextSevenDays().map(date => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      const dayOfWeek = date.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => handleDateSelect(date)}
                          className={`w-full p-4 text-left border rounded-lg transition-colors ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">{formatDate(date)}</div>
                              <div className="text-sm text-gray-600">
                                {isWeekend ? 'Weekend hours: 8 AM - 4 PM' : 'Regular hours: 7 AM - 6 PM'}
                              </div>
                            </div>
                            {formData.urgency === 'urgent' && (
                              <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Priority
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Available Times
                    {selectedDate && (
                      <span className="text-base font-normal text-gray-600 ml-2">
                        for {selectedDate.toLocaleDateString()}
                      </span>
                    )}
                  </h3>
                  
                  {!selectedDate ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a date to view available times</p>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading available times...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => handleTimeSelect(slot.time)}
                          disabled={!slot.available}
                          className={`p-3 text-sm border rounded-lg transition-colors ${
                            formData.appointmentTime === slot.time
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : slot.available
                              ? 'border-gray-300 hover:border-gray-400'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-medium">{formatTime(slot.time)}</div>
                          {slot.available && slot.technicianName && (
                            <div className="text-xs text-gray-500 mt-1">
                              {slot.technicianName.split(' ')[0]}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedService && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Service Summary</h4>
                  <div className="text-sm text-blue-800">
                    <div>{selectedService.label}</div>
                    <div>Estimated Duration: {selectedService.duration}</div>
                    <div>Starting Price: {selectedService.price}</div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('details')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={!formData.appointmentDate || !formData.appointmentTime}
                  className="flex-1"
                >
                  Continue to Confirm
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Your Appointment</h2>
              
              <div className="space-y-6">
                {/* Appointment Details */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Appointment Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700 font-medium">Date & Time</div>
                      <div className="text-blue-800">
                        {selectedDate && formatDate(selectedDate)}
                        <br />
                        {formatTime(formData.appointmentTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700 font-medium">Service</div>
                      <div className="text-blue-800">
                        {selectedService?.label}
                        <br />
                        {formData.deviceCount} device{formData.deviceCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 font-medium">Name</div>
                      <div>{formData.customerName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-medium">Phone</div>
                      <div>{formData.customerPhone}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-medium">Email</div>
                      <div>{formData.customerEmail}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-medium">Preferred Contact</div>
                      <div className="capitalize">{formData.contactMethod}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-gray-500 font-medium text-sm">Service Address</div>
                    <div className="text-sm">{formData.customerAddress}</div>
                  </div>
                </div>

                {/* Additional Information */}
                {(formData.deviceTypes.length > 0 || formData.notes || formData.preferredTechnician !== 'No Preference') && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                    
                    {formData.deviceTypes.length > 0 && (
                      <div className="mb-3">
                        <div className="text-gray-500 font-medium text-sm">Device Types</div>
                        <div className="text-sm">{formData.deviceTypes.join(', ')}</div>
                      </div>
                    )}
                    
                    {formData.preferredTechnician !== 'No Preference' && (
                      <div className="mb-3">
                        <div className="text-gray-500 font-medium text-sm">Preferred Technician</div>
                        <div className="text-sm">{formData.preferredTechnician}</div>
                      </div>
                    )}
                    
                    {formData.notes && (
                      <div>
                        <div className="text-gray-500 font-medium text-sm">Notes</div>
                        <div className="text-sm">{formData.notes}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Important Information */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Important:</strong> This is a request for appointment. We will contact you within 2 hours to confirm availability and finalize the details. If urgent, please call us directly at (253) 278-8692.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('datetime')}
                  className="flex-1"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your appointment request has been received. We will contact you within 2 hours to confirm your appointment.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <div className="text-sm text-blue-900 font-medium mb-2">What happens next:</div>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>• We'll call/email you to confirm availability</div>
                  <div>• Receive appointment details and technician info</div>
                  <div>• Get a reminder 24 hours before your appointment</div>
                  <div>• Receive invoice after service completion</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Reference Number: <span className="font-mono font-semibold">REQ-{Date.now().toString().slice(-6)}</span>
                </div>
                
                <div className="flex space-x-4">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/portal/dashboard">
                      View Account
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/">
                      Return Home
                    </Link>
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Need immediate assistance?</div>
                  <a href="tel:2532788692" className="text-blue-600 font-semibold">
                    (253) 278-8692
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}