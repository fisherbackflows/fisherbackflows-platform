'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  MapPin,
  LogOut,
  Route,
  User,
  AlertCircle,
  Phone,
  Navigation
} from 'lucide-react';
import Link from 'next/link';

interface TeamUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  license_number: string;
}

interface TodayAppointment {
  id: string;
  time: string;
  customer_name: string;
  address: string;
  phone: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  estimated_duration: number;
  travel_time: number;
}

export default function TesterDashboard() {
  const [user, setUser] = useState<TeamUser | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<TodayAppointment[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAppointment, setCurrentAppointment] = useState<TodayAppointment | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and role
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.role !== 'tester') {
            router.push('/team-portal');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/team-portal');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/team-portal');
      }
    };

    checkAuth();

    // Load today's schedule (mock data)
    setTodaySchedule([
      {
        id: '1',
        time: '09:00',
        customer_name: 'Johnson Properties LLC',
        address: '1234 Pacific Ave, Tacoma',
        phone: '(253) 555-0123',
        status: 'completed',
        estimated_duration: 45,
        travel_time: 15
      },
      {
        id: '2',
        time: '11:00',
        customer_name: 'Smith Residence',
        address: '5678 6th Ave, Lakewood',
        phone: '(253) 555-0456',
        status: 'in_progress',
        estimated_duration: 30,
        travel_time: 20
      },
      {
        id: '3',
        time: '14:00',
        customer_name: 'Parkland Medical Center',
        address: '910 112th St E, Puyallup',
        phone: '(253) 555-0789',
        status: 'scheduled',
        estimated_duration: 60,
        travel_time: 25
      }
    ]);

    // Set current appointment (in_progress)
    const inProgress = [
      {
        id: '2',
        time: '11:00',
        customer_name: 'Smith Residence',
        address: '5678 6th Ave, Lakewood',
        phone: '(253) 555-0456',
        status: 'in_progress' as const,
        estimated_duration: 30,
        travel_time: 20
      }
    ];
    if (inProgress.length > 0) {
      setCurrentAppointment(inProgress[0]);
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/team/auth/logout', { method: 'POST' });
      router.push('/team-portal');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed': return 'glass-green';
      case 'in_progress': return 'glass-yellow';
      default: return 'glass-blue';
    }
  };

  const testerActions = [
    {
      title: 'Fill Test Report',
      description: 'Complete current test',
      icon: <FileText className="h-8 w-8" />,
      href: currentAppointment ? `/app/test-report/${currentAppointment.id}` : '/app/test-reports',
      disabled: !currentAppointment
    },
    {
      title: 'View Schedule',
      description: 'Today\'s appointments',
      icon: <Calendar className="h-8 w-8" />,
      href: '/app/schedule',
      disabled: false
    },
    {
      title: 'Request Time Off',
      description: 'Submit time-off request',
      icon: <Clock className="h-8 w-8" />,
      href: '/app/time-off-request',
      disabled: false
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ 
        name: `${user.first_name} ${user.last_name}`, 
        email: user.email || '',
        role: 'Tester',
        licenseNumber: user.license_number
      }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-blue-300" />
            <div>
              <h1 className="text-3xl font-bold text-white">Tester Dashboard</h1>
              <p className="text-white/60">Field technician interface</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass rounded-2xl px-3 py-2">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-white/80">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              className="glass-btn-primary hover:glow-blue"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
          {/* Current Appointment */}
          {currentAppointment && (
            <div className="glass-yellow rounded-xl p-6 mb-8 glow-yellow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="glass-yellow rounded-2xl p-3">
                    <AlertCircle className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Current Appointment</h2>
                    <p className="text-yellow-300 text-sm">In Progress</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {formatTime(currentAppointment.time)}
                  </div>
                  <div className="text-yellow-300 text-sm">
                    ~{currentAppointment.estimated_duration} min
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-medium">{currentAppointment.customer_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-yellow-400" />
                  <span className="text-white/80">{currentAppointment.address}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-yellow-400" />
                  <span className="text-white/80">{currentAppointment.phone}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-yellow-400/20">
                <Link
                  href={`/app/test-report/${currentAppointment.id}`}
                  className="btn-glow px-6 py-3 rounded-2xl inline-flex items-center"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Complete Test Report
                </Link>
              </div>
            </div>
          )}

          {/* Tester Actions */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Tester Dashboard</h2>
              <div className="text-white/60 text-sm">Field technician access</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testerActions.map((action, index) => (
                <div key={index} className={`glass rounded-xl p-6 ${action.disabled ? 'opacity-50' : 'card-hover'}`}>
                  <div className="text-center">
                    <div className="inline-block glass-blue rounded-full p-4 mb-4 pulse-glow">
                      {action.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                    <p className="text-white/60 text-sm mb-4">{action.description}</p>
                    {!action.disabled ? (
                      <Link href={action.href} className="btn-glass px-4 py-2 rounded-2xl inline-flex items-center">
                        Access
                      </Link>
                    ) : (
                      <div className="text-white/40 text-sm">No active appointment</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Today's Schedule */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Today's Schedule</h2>
              <div className="glass rounded-2xl px-3 py-1">
                <span className="text-white/80 text-sm">{todaySchedule.length} appointments</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {todaySchedule.map((appointment, index) => (
                <div key={appointment.id} className="glass rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">
                          {formatTime(appointment.time)}
                        </div>
                        <div className={`text-xs ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">
                          {appointment.customer_name}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-white/60">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.address}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{appointment.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center space-x-2 ${getStatusBg(appointment.status)} rounded-2xl px-3 py-2`}>
                        <CheckCircle className={`h-4 w-4 ${getStatusColor(appointment.status)}`} />
                        <span className={`text-sm font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status === 'in_progress' ? 'IN PROGRESS' :
                           appointment.status === 'completed' ? 'COMPLETED' : 'SCHEDULED'}
                        </span>
                      </div>
                      <div className="text-white/40 text-xs mt-1">
                        {appointment.estimated_duration}min + {appointment.travel_time}min travel
                      </div>
                    </div>
                  </div>
                  
                  {appointment.status === 'scheduled' && index === todaySchedule.findIndex(a => a.status === 'scheduled') && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="text-white/60 text-sm">
                          Next appointment - travel time: {appointment.travel_time} minutes
                        </div>
                        <Button
                          size="sm"
                          className="btn-glass px-3 py-1 rounded-2xl"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
      </div>
    </div>
  );
}