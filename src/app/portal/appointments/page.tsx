'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Calendar, Clock, MapPin, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Get customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      
      if (customerData) {
        setCustomer(customerData);
        
        // Get appointments
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('*')
          .eq('customer_id', customerData.id)
          .order('scheduled_date', { ascending: true });
        
        setAppointments(appointmentsData || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />

      {/* Header */}
      <header className="glass border-b border-blue-400 sticky top-0 z-50 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white">
                Fisher Backflows
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/portal/dashboard" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Dashboard
                </Link>
                <Link href="/portal/devices" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Devices
                </Link>
                <Link href="/portal/appointments" className="px-4 py-2 rounded-2xl glass-btn-primary text-white glow-blue-sm font-medium">
                  Appointments
                </Link>
              </nav>
            </div>
            
            {customer && (
              <div className="hidden md:block text-right">
                <p className="font-semibold text-white">{customer.first_name} {customer.last_name}</p>
                <p className="text-sm text-white/80">Account: {customer.account_number}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-8">
          <Link href="/portal/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white">Your Appointments</h1>
              <p className="text-white/90 text-lg">View and manage your scheduled service appointments</p>
            </div>
            <Link href="/portal/schedule">
              <Button className="btn-glow px-6 py-3 rounded-2xl">
                Schedule New Test
              </Button>
            </Link>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="glass rounded-2xl p-12 border border-blue-400 text-center">
            <Calendar className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Appointments Scheduled</h2>
            <p className="text-white/80 mb-6">You don't have any upcoming appointments</p>
            <Link href="/portal/schedule">
              <Button className="btn-glow px-6 py-3 rounded-2xl">
                Schedule Your First Test
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((appointment) => {
              const date = new Date(appointment.scheduled_date);
              const isPast = date < new Date();
              const statusColor = {
                'scheduled': 'text-blue-400',
                'completed': 'text-green-400',
                'cancelled': 'text-red-400',
                'in_progress': 'text-yellow-400'
              }[appointment.status] || 'text-white/60';

              return (
                <div key={appointment.id} className="glass rounded-2xl p-6 border border-blue-400 hover:glow-blue-sm transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <Calendar className="h-6 w-6 text-blue-400" />
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          <p className={`text-sm font-medium ${statusColor}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2 text-white/80">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span>
                            {appointment.scheduled_time_start ? 
                              `${appointment.scheduled_time_start.slice(0,5)} - ${appointment.scheduled_time_end?.slice(0,5) || ''}` 
                              : 'Time TBD'}
                          </span>
                        </div>
                        
                        {appointment.appointment_type && (
                          <div className="flex items-center space-x-2 text-white/80">
                            <MapPin className="h-4 w-4 text-blue-400" />
                            <span>{appointment.appointment_type.replace('_', ' ').charAt(0).toUpperCase() + appointment.appointment_type.slice(1).replace('_', ' ')}</span>
                          </div>
                        )}
                        
                        {appointment.priority && appointment.priority !== 'normal' && (
                          <div className="flex items-center space-x-2 text-white/80">
                            <User className="h-4 w-4 text-blue-400" />
                            <span>Priority: {appointment.priority}</span>
                          </div>
                        )}
                      </div>

                      {(appointment.customer_notes || appointment.special_instructions) && (
                        <div className="mt-4 p-3 bg-white/5 rounded-xl">
                          <p className="text-white/80 text-sm">{appointment.customer_notes || appointment.special_instructions}</p>
                        </div>
                      )}
                    </div>

                    {appointment.status === 'scheduled' && !isPast && (
                      <div className="ml-4">
                        <Button 
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this appointment?')) {
                              // Cancel appointment logic here
                              console.log('Cancel appointment:', appointment.id);
                            }
                          }}
                          className="btn-glass px-4 py-2 rounded-2xl text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}