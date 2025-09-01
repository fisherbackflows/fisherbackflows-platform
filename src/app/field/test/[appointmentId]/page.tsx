'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Camera, 
  Save,
  ArrowLeft,
  Clock,
  Gauge,
  MapPin,
  User,
  Phone,
  Wrench,
  WifiOff,
  Wifi,
  CloudOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineMode } from '@/lib/offline';
import { toast } from 'react-hot-toast';

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  deviceLocation: string;
  notes: string;
  device?: {
    id: string;
    serialNumber: string;
    size: string;
    make: string;
    model: string;
    lastTestDate: string;
  };
}

export default function FieldTestPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [testData, setTestData] = useState({
    initialPressure: '',
    finalPressure: '',
    testDuration: '',
    testResult: '', // 'Passed', 'Failed', 'Needs Repair'
    notes: '',
    waterDistrict: 'City of Tacoma',
    photos: [] as string[],
    technician: 'Mike Fisher'
  });

  // Offline mode support
  const { isOnline, storeTestReport, pendingSync } = useOfflineMode();

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      // Fetch real appointment data from API
      const response = await fetch(`/api/appointments/${appointmentId}`);
      
      if (!response.ok) {
        throw new Error('Appointment not found');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch appointment');
      }
      
      // Transform API response to match component interface
      const transformedAppointment: Appointment = {
        id: data.appointment.id,
        customerName: data.appointment.customerName || data.appointment.customer?.name || 'Unknown Customer',
        customerPhone: data.appointment.customerPhone || data.appointment.customer?.phone || '',
        address: data.appointment.customer?.address || data.appointment.deviceLocation || '',
        serviceType: data.appointment.serviceType || 'Annual Test',
        appointmentDate: data.appointment.date || data.appointment.appointment_date || new Date().toISOString().split('T')[0],
        appointmentTime: data.appointment.time || data.appointment.appointment_time || '10:00',
        deviceLocation: data.appointment.deviceLocation || data.appointment.device_location || data.appointment.customer?.address || '',
        notes: data.appointment.notes || '',
        device: data.appointment.device || {
          id: data.appointment.device_id || `device_${appointmentId}`,
          serialNumber: data.appointment.device?.serial_number || 'Unknown',
          size: data.appointment.device?.size || '3/4"',
          make: data.appointment.device?.make || 'Unknown',
          model: data.appointment.device?.model || 'Unknown',
          lastTestDate: data.appointment.device?.last_test_date || '2023-01-01'
        }
      };
      
      setAppointment(transformedAppointment);
    } catch (error) {
      toast.error('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setTestStartTime(new Date());
  };

  const handleInputChange = (field: string, value: string) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTestResult = () => {
    const initial = parseFloat(testData.initialPressure);
    const final = parseFloat(testData.finalPressure);
    
    if (!initial || !final) return '';
    
    const pressureDrop = initial - final;
    const allowableDrop = 1.0; // PSI
    
    if (pressureDrop <= allowableDrop) {
      return 'Passed';
    } else if (pressureDrop <= 2.0) {
      return 'Needs Repair';
    } else {
      return 'Failed';
    }
  };

  const capturePhoto = () => {
    // TODO: Implement mobile camera integration
    toast.info('Camera feature coming soon');
  };

  const submitTest = async () => {
    try {
      setSubmitting(true);

      // Auto-calculate test result if not set
      let result = testData.testResult;
      if (!result) {
        result = calculateTestResult();
      }

      // Calculate actual test duration if test was started
      let duration = testData.testDuration;
      if (!duration && testStartTime) {
        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - testStartTime.getTime()) / 60000);
        duration = durationMinutes.toString();
      }

      const testSubmission = {
        appointmentId: appointmentId,
        deviceId: appointment?.device?.id,
        customerId: appointment?.customerId,
        customerName: appointment?.customerName,
        customerEmail: appointment?.customerEmail || `${appointment?.customerName?.toLowerCase().replace(' ', '.')}@email.com`,
        deviceLocation: appointment?.deviceLocation,
        testDate: new Date().toISOString().split('T')[0],
        initialPressure: parseFloat(testData.initialPressure),
        finalPressure: parseFloat(testData.finalPressure),
        testDuration: parseInt(duration) || 15,
        testResult: result,
        notes: testData.notes,
        waterDistrict: testData.waterDistrict,
        technician: testData.technician,
        photos: testData.photos
      };

      if (!isOnline) {
        // Store offline for later sync
        storeTestReport(testSubmission);
        
        toast.success(`Test completed and saved offline! Report will sync when online. (${pendingSync + 1} items pending)`);
        router.push('/field/dashboard');
        return;
      }

      // Submit to automated completion workflow
      const response = await fetch('/api/test-reports/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testSubmission)
      });

      const result_response = await response.json();

      if (result_response.success) {
        // Success! Everything is automated from here
        toast.success('Test completed successfully! Report submitted, invoice generated, and notifications sent.');
        router.push('/field/dashboard');
      } else {
        throw new Error(result_response.error);
      }

    } catch (error: any) {
      toast.error(`Error submitting test: ${error.message || 'Please try again'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading appointment details...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Appointment not found</div>
      </div>
    );
  }

  const testResult = calculateTestResult();

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />

      <div className="max-w-md mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.push('/field/dashboard')}
            className="btn-glass p-2 rounded-2xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Field Test</h1>
            <div className="flex items-center justify-center space-x-1 mt-1">
              {isOnline ? (
                <Wifi className="h-3 w-3 text-green-400" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-400" />
              )}
              <span className="text-xs text-white/60">
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
              {pendingSync > 0 && (
                <span className="text-xs bg-orange-500 text-white px-1 rounded">
                  {pendingSync}
                </span>
              )}
            </div>
          </div>
          <div className="w-10" />
        </div>

        {/* Customer Info */}
        <div className="glass rounded-2xl p-4 mb-6">
          <h2 className="text-lg font-bold text-blue-400 mb-3">Job Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-white">
              <User className="h-4 w-4 mr-3 text-blue-400" />
              {appointment.customerName}
            </div>
            <div className="flex items-center text-white">
              <Phone className="h-4 w-4 mr-3 text-blue-400" />
              {appointment.customerPhone}
            </div>
            <div className="flex items-center text-white">
              <MapPin className="h-4 w-4 mr-3 text-blue-400" />
              {appointment.address}
            </div>
            {appointment.notes && (
              <div className="mt-3 p-2 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 rounded text-blue-300 text-xs">
                📝 {appointment.notes}
              </div>
            )}
          </div>
        </div>

        {/* Device Info */}
        {appointment.device && (
          <div className="glass rounded-2xl p-4 mb-6">
            <h2 className="text-lg font-bold text-blue-400 mb-3">Device Info</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/60">Serial:</span>
                <p className="text-white font-mono">{appointment.device.serialNumber}</p>
              </div>
              <div>
                <span className="text-white/60">Size:</span>
                <p className="text-white">{appointment.device.size}</p>
              </div>
              <div>
                <span className="text-white/60">Make:</span>
                <p className="text-white">{appointment.device.make}</p>
              </div>
              <div>
                <span className="text-white/60">Model:</span>
                <p className="text-white">{appointment.device.model}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Controls */}
        <div className="glass rounded-2xl p-4 mb-6">
          <h2 className="text-lg font-bold text-blue-400 mb-4">Test Readings</h2>
          
          {!testStarted ? (
            <Button
              onClick={startTest}
              className="btn-glow w-full py-4 text-lg font-bold rounded-xl"
            >
              <Clock className="h-5 w-5 mr-2" />
              Start Test Timer
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Timer Display */}
              {testStartTime && (
                <div className="text-center p-3 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 rounded-xl">
                  <p className="text-green-400 text-lg font-bold">
                    ⏱️ Test Started: {testStartTime.toLocaleTimeString()}
                  </p>
                </div>
              )}

              {/* Pressure Readings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    <Gauge className="h-4 w-4 inline mr-1" />
                    Initial Pressure (PSI)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="15.0"
                    value={testData.initialPressure}
                    onChange={(e) => handleInputChange('initialPressure', e.target.value)}
                    className="input-glass w-full px-3 py-2 rounded-2xl text-white text-center text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    <Gauge className="h-4 w-4 inline mr-1" />
                    Final Pressure (PSI)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="14.5"
                    value={testData.finalPressure}
                    onChange={(e) => handleInputChange('finalPressure', e.target.value)}
                    className="input-glass w-full px-3 py-2 rounded-2xl text-white text-center text-lg font-bold"
                  />
                </div>
              </div>

              {/* Auto-calculated Result */}
              {testResult && (
                <div className={`text-center p-3 rounded-xl ${
                  testResult === 'Passed' 
                    ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 text-green-400' 
                    : testResult === 'Failed'
                      ? 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <p className="font-bold text-lg">
                    {testResult === 'Passed' && <CheckCircle className="h-6 w-6 inline mr-2" />}
                    {testResult === 'Failed' && <XCircle className="h-6 w-6 inline mr-2" />}
                    {testResult === 'Needs Repair' && <AlertTriangle className="h-6 w-6 inline mr-2" />}
                    {testResult}
                  </p>
                  <p className="text-sm opacity-80">
                    Pressure drop: {testData.initialPressure && testData.finalPressure 
                      ? (parseFloat(testData.initialPressure) - parseFloat(testData.finalPressure)).toFixed(1) 
                      : '0'} PSI
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Test Notes (Optional)
                </label>
                <textarea
                  placeholder="Any observations, issues, or special notes..."
                  value={testData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="input-glass w-full px-3 py-2 rounded-2xl text-white resize-none"
                />
              </div>

              {/* Water District */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Water District
                </label>
                <select
                  value={testData.waterDistrict}
                  onChange={(e) => handleInputChange('waterDistrict', e.target.value)}
                  className="input-glass w-full px-3 py-2 rounded-2xl text-white"
                >
                  <option value="City of Tacoma">City of Tacoma</option>
                  <option value="Lakewood Water District">Lakewood Water District</option>
                  <option value="Puyallup Water">Puyallup Water</option>
                  <option value="Federal Way">Federal Way</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Photo Capture */}
              <Button
                onClick={capturePhoto}
                className="btn-glass w-full py-3 rounded-2xl"
              >
                <Camera className="h-5 w-5 mr-2" />
                Take Photos (Optional)
              </Button>
            </div>
          )}
        </div>

        {/* Submit Test */}
        {testStarted && testData.initialPressure && testData.finalPressure && (
          <Button
            onClick={submitTest}
            disabled={submitting}
            className="btn-glow w-full py-4 text-xl font-bold rounded-2xl"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : (
              <>
                <Save className="h-6 w-6 mr-3" />
                Complete Test & Auto-Process
              </>
            )}
          </Button>
        )}

        {testStarted && testData.initialPressure && testData.finalPressure && (
          <div className="mt-4 text-center">
            <p className="text-white/60 text-sm">
              ✨ This will automatically:<br/>
              📊 Submit report to water department<br/>
              💰 Generate & send invoice<br/>
              📧 Email customer with results<br/>
              📅 Schedule next year's test
            </p>
          </div>
        )}
      </div>
    </div>
  );
}