'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Wrench,
  ArrowRight,
  Wifi,
  WifiOff,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isAuthenticatedTech, getCurrentTech, signOutTech } from '@/lib/auth';
import { useFieldTechUpdates } from '@/hooks/useRealtime';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  deviceLocation: string;
  status: string;
  notes?: string;
}

export default function FieldDashboard() {
  const router = useRouter();
  const [techUser, setTechUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if tech is authenticated
    if (!isAuthenticatedTech()) {
      router.push('/field/login');
      return;
    }

    const tech = getCurrentTech();
    setTechUser(tech);

    fetchTodayAppointments();
  }, [router]);

  // Real-time updates for appointments and test reports
  const { connections } = useFieldTechUpdates(
    techUser?.name || 'Mike Fisher',
    {
      onAppointmentUpdate: (appointment, event) => {
        console.log(`🔄 Appointment ${event}:`, appointment);
        
        if (event === 'INSERT' || event === 'UPDATE') {
          // Update appointment in the list
          setAppointments(prev => {
            const existing = prev.find(a => a.id === appointment.id);
            if (existing) {
              // Update existing appointment
              return prev.map(a => 
                a.id === appointment.id 
                  ? { ...a, ...transformAppointment(appointment) }
                  : a
              );
            } else {
              // Add new appointment if it's for today
              const today = new Date().toISOString().split('T')[0];
              if (appointment.appointment_date === today) {
                return [...prev, transformAppointment(appointment)];
              }
              return prev;
            }
          });

          // Show notification
          showNotification(`Appointment ${event === 'INSERT' ? 'added' : 'updated'}: ${appointment.customer_name}`, 'info');
        } else if (event === 'DELETE') {
          // Remove appointment from list
          setAppointments(prev => prev.filter(a => a.id !== appointment.id));
          showNotification(`Appointment cancelled: ${appointment.customer_name}`, 'warning');
        }
      },
      onTestReportUpdate: (testReport, event) => {
        console.log(`🔬 Test report ${event}:`, testReport);
        
        if (event === 'INSERT') {
          // Update appointment status to completed
          setAppointments(prev => 
            prev.map(a => 
              a.id === testReport.appointment_id 
                ? { ...a, status: 'Completed' }
                : a
            )
          );
          showNotification(`Test completed: ${testReport.customer_name}`, 'success');
        }
      }
    }
  );

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`/api/appointments?date=${today}&status=Scheduled`);
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Use mock data if API fails
      setAppointments([
        {
          id: '1',
          customerName: 'John Smith',
          customerPhone: '(253) 555-0123',
          serviceType: 'Annual Test',
          appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: '10:00',
          deviceLocation: '123 Main St - Backyard',
          status: 'Scheduled',
          notes: 'Gate code: 1234'
        },
        {
          id: '2',
          customerName: 'Sarah Johnson',
          customerPhone: '(253) 555-0124',
          serviceType: 'Repair & Retest',
          appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: '14:00',
          deviceLocation: '456 Oak Ave - Side Yard',
          status: 'Scheduled',
          notes: 'Previous test failed - repair completed'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutTech();
    router.push('/field/login');
  };

  // Transform database appointment to UI format
  const transformAppointment = (dbAppointment: any): Appointment => ({
    id: dbAppointment.id,
    customerName: dbAppointment.customer_name || dbAppointment.customers?.name || 'Unknown',
    customerPhone: dbAppointment.customer_phone || dbAppointment.customers?.phone || '',
    serviceType: dbAppointment.service_type || 'Annual Test',
    appointmentDate: dbAppointment.appointment_date,
    appointmentTime: dbAppointment.appointment_time,
    deviceLocation: dbAppointment.device_location || dbAppointment.customers?.address || '',
    status: dbAppointment.status,
    notes: dbAppointment.notes || ''
  });

  // Show notification to user
  const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    // Simple notification - you could replace with a toast library
    const colors = {
      info: '#3B82F6',
      success: '#10B981', 
      warning: '#F59E0B',
      error: '#EF4444'
    };

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 4000);
  };

  const startTest = (appointmentId: string) => {
    router.push(`/field/test/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" color="blue" text="Loading field dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <Logo width={160} height={128} />
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Fisher Backflows</h1>
                  <p className="text-xs text-slate-800">Field Dashboard</p>
                </div>
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/field" className="px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors">
                  <Home className="h-4 w-4 mr-2 inline" />
                  Field Portal
                </Link>
                <Link href="/field/dashboard" className="px-4 py-2 rounded-lg bg-blue-200 text-blue-700 border border-blue-200 font-medium">
                  <Calendar className="h-4 w-4 mr-2 inline" />
                  Dashboard
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-800 bg-white px-3 py-2 rounded-lg border flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-green-800" />
                <span>Welcome, {techUser?.name || 'Technician'}</span>
              </div>
              <div className={`text-sm px-3 py-2 rounded-lg border flex items-center space-x-2 ${
                connections.appointments 
                  ? 'bg-green-200 text-green-700 border-green-200' 
                  : 'bg-red-200 text-red-700 border-red-200'
              }`}>
                {connections.appointments ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span>Live Updates</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>Offline Mode</span>
                  </>
                )}
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Today's Field Schedule
            </h2>
            <p className="text-slate-800 text-xl">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-6">
                <Calendar className="h-12 w-12 text-slate-700" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                No appointments scheduled for today
              </h3>
              <p className="text-slate-800 text-lg">
                Enjoy your day off or check back tomorrow!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="bg-white border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    {/* Appointment Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                        <div className="flex items-center space-x-3 bg-blue-200 border border-blue-200 rounded-xl px-4 py-3">
                          <Clock className="h-6 w-6 text-blue-800" />
                          <span className="text-slate-900 font-bold text-xl">
                            {appointment.appointmentTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 bg-green-200 border border-green-200 rounded-xl px-4 py-3">
                          <User className="h-6 w-6 text-green-800" />
                          <span className="text-slate-900 font-bold text-lg">
                            {appointment.customerName}
                          </span>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                        appointment.status === 'Scheduled' 
                          ? 'bg-green-200 text-green-700 border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {appointment.status}
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center space-x-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Wrench className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-800">Service Type</p>
                          <p className="font-semibold text-slate-900">
                            {appointment.serviceType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <MapPin className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-800">Location</p>
                          <p className="font-semibold text-slate-900 text-sm">
                            {appointment.deviceLocation}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <Phone className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-800">Phone</p>
                          <p className="font-semibold text-slate-900">
                            <a href={`tel:${appointment.customerPhone}`} className="hover:text-cyan-600 transition-colors">
                              {appointment.customerPhone}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start space-x-3">
                          <div className="p-1 bg-amber-100 rounded">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-800 mb-1">Special Notes:</p>
                            <p className="text-amber-700 text-sm">{appointment.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => startTest(appointment.id)}
                        className="flex-1 bg-green-700 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200"
                      >
                        <Wrench className="h-5 w-5 mr-3" />
                        Start Test
                        <ArrowRight className="h-5 w-5 ml-3" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(`tel:${appointment.customerPhone}`)}
                        className="border-slate-300 text-slate-700 hover:bg-white py-4 px-6 rounded-xl"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="inline-flex p-4 bg-green-300 rounded-2xl mb-4">
              <CheckCircle className="h-8 w-8 text-green-800" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Tests Today</h3>
            <p className="text-4xl font-bold text-green-800 mb-1">{appointments.length}</p>
            <p className="text-slate-800 text-sm">Scheduled appointments</p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="inline-flex p-4 bg-blue-300 rounded-2xl mb-4">
              <Clock className="h-8 w-8 text-blue-800" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Estimated Time</h3>
            <p className="text-4xl font-bold text-blue-800 mb-1">
              {appointments.length > 0 ? `${appointments.length * 1}h` : '0h'}
            </p>
            <p className="text-slate-800 text-sm">Total field time</p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="inline-flex p-4 bg-orange-100 rounded-2xl mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Priority Jobs</h3>
            <p className="text-4xl font-bold text-orange-600 mb-1">
              {appointments.filter(a => a.serviceType.includes('Repair')).length}
            </p>
            <p className="text-slate-800 text-sm">Repair & retest required</p>
          </div>
        </div>
      </main>
    </div>
  );
}