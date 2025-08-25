'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  todayTests: number;
  weekTests: number;
  pendingReports: number;
  monthRevenue: number;
}

interface TodayAppointment {
  id: string;
  time: string;
  customerName: string;
  address: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

export default function AppDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayTests: 0,
    weekTests: 0,
    pendingReports: 0,
    monthRevenue: 0
  });
  
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Load sample data
    setStats({
      todayTests: 3,
      weekTests: 12,
      pendingReports: 5,
      monthRevenue: 2850
    });

    setTodayAppointments([
      {
        id: '1',
        time: '09:00',
        customerName: 'Johnson Properties LLC',
        address: '1234 Pacific Ave',
        status: 'scheduled'
      },
      {
        id: '2',
        time: '11:00',
        customerName: 'Smith Residence',
        address: '5678 6th Ave',
        status: 'scheduled'
      },
      {
        id: '3',
        time: '14:00',
        customerName: 'Parkland Medical Center',
        address: '910 112th St E',
        status: 'scheduled'
      }
    ]);

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const quickActions = [
    {
      title: 'New Test Report',
      description: 'Start field testing',
      icon: <FileText className="h-8 w-8" />,
      href: '/app/test-report',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Add Customer',
      description: 'Quick entry',
      icon: <Users className="h-8 w-8" />,
      href: '/app/customers/new',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'View Schedule',
      description: 'Today\'s appointments',
      icon: <Calendar className="h-8 w-8" />,
      href: '/app/schedule',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Create Invoice',
      description: 'Bill customer',
      icon: <DollarSign className="h-8 w-8" />,
      href: '/app/invoices/new',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  const pendingActions = [
    {
      title: '5 Reports Need Submission',
      description: 'Submit to water districts',
      icon: <FileText className="h-6 w-6" />,
      href: '/app/district-reports',
      urgency: 'medium'
    },
    {
      title: '2 Overdue Tests',
      description: 'Contact customers',
      icon: <AlertTriangle className="h-6 w-6" />,
      href: '/app/customers?filter=overdue',
      urgency: 'high'
    },
    {
      title: '3 Unpaid Invoices',
      description: 'Send reminders',
      icon: <DollarSign className="h-6 w-6" />,
      href: '/app/invoices?status=pending',
      urgency: 'medium'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="text-xl font-bold">
                Fisher <span className="text-blue-400">Backflows</span>
              </div>
              <Smartphone className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex items-center space-x-2 text-sm">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-gray-300">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{stats.todayTests}</div>
              <div className="text-xs text-gray-300">Today</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{stats.weekTests}</div>
              <div className="text-xs text-gray-300">This Week</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{stats.pendingReports}</div>
              <div className="text-xs text-gray-300">Pending</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">${stats.monthRevenue.toLocaleString()}</div>
              <div className="text-xs text-gray-300">Month</div>
            </div>
          </div>
        </div>

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="bg-yellow-500 text-black text-center py-2 text-sm">
            ⚠️ Offline Mode - Data will sync when connected
          </div>
        )}
      </header>

      <main className="p-4 pb-20">
        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`${action.color} text-white p-4 rounded-xl transition-transform hover:scale-105 active:scale-95`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  {action.icon}
                  <div className="font-semibold text-sm">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Today's Schedule */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/schedule">View All</Link>
            </Button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <div key={appointment.id} className="p-4 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-blue-600 font-bold text-lg">
                        {formatTime(appointment.time)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {appointment.customerName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {appointment.address}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                      {appointment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No appointments today</p>
                <p className="text-sm">Time to catch up on paperwork!</p>
              </div>
            )}
          </div>
        </section>

        {/* Pending Actions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Needs Attention</h2>
          
          {pendingActions.length > 0 ? (
            <div className="space-y-3">
              {pendingActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        action.urgency === 'high' ? 'bg-red-100 text-red-600' :
                        action.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {action.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {action.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {action.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-gray-600">All caught up!</p>
              <p className="text-sm text-gray-500">No pending actions</p>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Test completed</div>
                  <div className="text-sm text-gray-600">Johnson Properties LLC • 2 hours ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 pb-3 border-b">
                <DollarSign className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Invoice paid</div>
                  <div className="text-sm text-gray-600">Smith Residence • $85.00 • 1 day ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-purple-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Report submitted</div>
                  <div className="text-sm text-gray-600">Tacoma Water District • 2 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          <Link href="/app" className="flex flex-col items-center py-2 px-1 text-blue-600 bg-blue-50">
            <div className="p-1">
              <div className="h-6 w-6 bg-blue-600 rounded"></div>
            </div>
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/app/customers" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Users className="h-6 w-6" />
            <span className="text-xs">Customers</span>
          </Link>
          <Link href="/app/test-report" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Plus className="h-6 w-6" />
            <span className="text-xs">Test</span>
          </Link>
          <Link href="/app/schedule" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Schedule</span>
          </Link>
          <Link href="/app/more" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            </div>
            <span className="text-xs">More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}