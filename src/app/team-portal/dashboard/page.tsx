'use client';

import { useState, useEffect } from 'react';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Activity,
  BarChart3,
  Bell,
  Settings,
  ArrowRight,
  PlusCircle,
  Eye,
  Edit,
  Send,
  Shield
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  customers: {
    total: number;
    active: number;
    needsService: number;
  };
  appointments: {
    scheduled: number;
    completed: number;
    pending: number;
  };
  financials: {
    monthlyRevenue: number;
    pendingInvoices: number;
    overduePayments: number;
  };
  testing: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  icon: string;
  text: string;
  time: string;
  color: string;
}

export default function TeamPortalDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    customers: { total: 0, active: 0, needsService: 0 },
    appointments: { scheduled: 0, completed: 0, pending: 0 },
    financials: { monthlyRevenue: 0, pendingInvoices: 0, overduePayments: 0 },
    testing: { totalTests: 0, passedTests: 0, failedTests: 0, passRate: 0 }
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user info (optional for public access)
        const userResponse = await fetch('/api/team/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserInfo(userData);
        }

        // For unauthenticated users, load demo/sample data
        const isAuthenticated = userResponse.ok;

        if (isAuthenticated) {
          // Load real metrics from admin API (team portal has admin-level access)
          const [metricsResponse, activityResponse] = await Promise.allSettled([
            fetch('/api/admin/metrics'),
            fetch('/api/admin/activity?limit=5')
          ]);

          // Process metrics
          if (metricsResponse.status === 'fulfilled' && metricsResponse.value.ok) {
            const metricsData = await metricsResponse.value.json();
            if (metricsData.success) {
              setStats(metricsData.metrics);
            }
          }

          // Process activities
          if (activityResponse.status === 'fulfilled' && activityResponse.value.ok) {
            const activityData = await activityResponse.value.json();
            if (activityData.success) {
              setActivities(activityData.activities || []);
            }
          }
        } else {
          // Set demo data for unauthenticated users
          setStats({
            customers: { total: 247, active: 189, needsService: 32 },
            appointments: { scheduled: 14, completed: 128, pending: 7 },
            financials: { monthlyRevenue: 18450, pendingInvoices: 12, overduePayments: 3 },
            testing: { totalTests: 384, passedTests: 362, failedTests: 22, passRate: 94 }
          });

          setActivities([
            { id: '1', type: 'test', icon: 'CheckCircle', text: 'Test completed for 1234 Main St', time: '2 hours ago', color: 'green' },
            { id: '2', type: 'customer', icon: 'Users', text: 'New customer registered', time: '5 hours ago', color: 'blue' },
            { id: '3', type: 'appointment', icon: 'Calendar', text: 'Appointment scheduled for tomorrow', time: '1 day ago', color: 'purple' },
            { id: '4', type: 'payment', icon: 'DollarSign', text: 'Payment received from ABC Corp', time: '2 days ago', color: 'green' },
            { id: '5', type: 'alert', icon: 'Activity', text: 'Device inspection due soon', time: '3 days ago', color: 'orange' }
          ]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError(null); // Don't show error for unauthenticated users
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <TeamPortalNavigation userInfo={userInfo} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <TeamPortalNavigation userInfo={userInfo} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Dashboard</h2>
              <p className="text-white/90 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} className="glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasData = stats.customers.total > 0 || stats.appointments.scheduled > 0 || stats.testing.totalTests > 0;

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={userInfo} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-8">
          {/* Professional Header */}
          <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-3">
                  Team Portal Dashboard
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  {userInfo ? 'Manage customers, schedule tests, and track business performance' : 'Professional backflow testing management platform'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {userInfo ? (
                  <>
                    <Link href="/admin/dashboard">
                      <Button className="glass-btn-primary hover:glow-blue bg-purple-500/20 border border-purple-400 text-white px-6 py-3 rounded-2xl glow-blue-sm font-medium transition-colors duration-200 flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        System Admin
                      </Button>
                    </Link>
                    <Link href="/team-portal/customers/new">
                      <Button className="glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl glow-blue-sm font-medium transition-colors duration-200 flex items-center">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Add Customer
                      </Button>
                    </Link>
                    <Link href="/team-portal/schedule/new">
                      <Button className="glass-btn-primary hover:glow-blue bg-emerald-500/20 border border-emerald-400 text-white px-6 py-3 rounded-2xl glow-blue-sm font-medium transition-colors duration-200 flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Schedule Test
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/team-portal/login">
                      <Button className="glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl glow-blue-sm font-medium transition-colors duration-200 flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Business Login
                      </Button>
                    </Link>
                    <Link href="/portal/login">
                      <Button className="glass-btn-primary hover:glow-blue bg-emerald-500/20 border border-emerald-400 text-white px-6 py-3 rounded-2xl glow-blue-sm font-medium transition-colors duration-200 flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Customer Portal
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Professional Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Customers */}
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6 hover:glow-blue transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl">
                  <Users className="h-8 w-8 text-blue-300" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{hasData ? stats.customers.total.toLocaleString() : '0'}</div>
                  <div className="text-sm text-white/80">{hasData ? `${stats.customers.active} active` : 'No customers yet'}</div>
                </div>
              </div>
              <div className="text-white/80 font-medium">Total Customers</div>
            </div>

            {/* Scheduled Appointments */}
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6 hover:glow-blue transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl">
                  <Calendar className="h-8 w-8 text-emerald-300" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{hasData ? stats.appointments.scheduled : '0'}</div>
                  <div className="text-sm text-white/80">{hasData ? `${stats.appointments.completed} completed` : 'No appointments'}</div>
                </div>
              </div>
              <div className="text-white/80 font-medium">Scheduled Tests</div>
            </div>

            {/* Test Results */}
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6 hover:glow-blue transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 rounded-2xl">
                  <FileText className="h-8 w-8 text-amber-300" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{hasData ? stats.testing.totalTests : '0'}</div>
                  <div className="text-sm text-white/80">{hasData ? `${stats.testing.passRate}% pass rate` : 'No tests completed'}</div>
                </div>
              </div>
              <div className="text-white/80 font-medium">Total Tests</div>
            </div>

            {/* Monthly Revenue */}
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6 hover:glow-blue transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-2xl">
                  <CreditCard className="h-8 w-8 text-purple-300" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">${hasData ? stats.financials.monthlyRevenue.toLocaleString() : '0'}</div>
                  <div className="text-sm text-white/80">{hasData ? `${stats.financials.pendingInvoices} pending` : 'No revenue yet'}</div>
                </div>
              </div>
              <div className="text-white/80 font-medium">Monthly Revenue</div>
            </div>
          </div>

          {/* Dashboard Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Recent Activity</h2>
                  <p className="text-white/90">Latest updates and actions</p>
                </div>
                <Button className="glass-btn-primary hover:glow-blue text-white px-4 py-2 rounded-2xl glow-blue-sm font-medium transition-colors duration-200">
                  <Activity className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => {
                    const iconMap: { [key: string]: any } = {
                      CheckCircle,
                      Users,
                      Calendar,
                      Clock,
                      Mail: Send,
                      DollarSign: CreditCard,
                      Activity
                    };
                    const IconComponent = iconMap[activity.icon] || Activity;
                    
                    return (
                      <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-2xl glass border border-blue-500/40 hover:glass transition-colors duration-200">
                        <div className="p-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl">
                          <IconComponent className="h-5 w-5 text-blue-300" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{activity.text}</p>
                          <p className="text-sm text-white/80">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-white/90 mx-auto mb-4" />
                    <p className="text-white/80 mb-4">No recent activity</p>
                    <p className="text-sm text-white/90">Activity will appear here as you start using the system</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Quick Actions</h2>
                <p className="text-white/90">{userInfo ? 'Common tasks and shortcuts' : 'Key features available'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => !userInfo && alert('Please log in to access this feature')}
                  className={`group glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-400 hover:border-blue-200 rounded-2xl p-6 hover:glow-blue transition-all duration-200 ${userInfo ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                >
                  {userInfo ? (
                    <Link href="/team-portal/customers">
                      <div>
                        <Users className="h-10 w-10 text-blue-300 mb-4 group-hover:scale-105 transition-transform duration-200" />
                        <h3 className="font-bold text-white mb-2">Manage Customers</h3>
                        <p className="text-sm text-white/90">View and edit customer information</p>
                      </div>
                    </Link>
                  ) : (
                    <div>
                      <Users className="h-10 w-10 text-blue-300 mb-4" />
                      <h3 className="font-bold text-white mb-2">Manage Customers</h3>
                      <p className="text-sm text-white/90">View and edit customer information</p>
                    </div>
                  )}
                </div>

                <div
                  onClick={() => !userInfo && alert('Please log in to access this feature')}
                  className={`group glass hover:bg-emerald-500/20 border border-emerald-400 glow-blue-sm hover:border-emerald-200 rounded-2xl p-6 hover:glow-blue transition-all duration-200 ${userInfo ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                >
                  {userInfo ? (
                    <Link href="/team-portal/schedule">
                      <div>
                        <Calendar className="h-10 w-10 text-emerald-300 mb-4 group-hover:scale-105 transition-transform duration-200" />
                        <h3 className="font-bold text-white mb-2">Schedule Tests</h3>
                        <p className="text-sm text-white/90">Book and manage appointments</p>
                      </div>
                    </Link>
                  ) : (
                    <div>
                      <Calendar className="h-10 w-10 text-emerald-300 mb-4" />
                      <h3 className="font-bold text-white mb-2">Schedule Tests</h3>
                      <p className="text-sm text-white/90">Book and manage appointments</p>
                    </div>
                  )}
                </div>

                <div
                  onClick={() => !userInfo && alert('Please log in to access this feature')}
                  className={`group glass hover:bg-amber-50 border border-blue-400 hover:border-amber-200 rounded-2xl p-6 hover:glow-blue transition-all duration-200 ${userInfo ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                >
                  {userInfo ? (
                    <Link href="/team-portal/test-report">
                      <div>
                        <FileText className="h-10 w-10 text-amber-300 mb-4 group-hover:scale-105 transition-transform duration-200" />
                        <h3 className="font-bold text-white mb-2">Test Reports</h3>
                        <p className="text-sm text-white/90">Create and manage test reports</p>
                      </div>
                    </Link>
                  ) : (
                    <div>
                      <FileText className="h-10 w-10 text-amber-300 mb-4" />
                      <h3 className="font-bold text-white mb-2">Test Reports</h3>
                      <p className="text-sm text-white/90">Create and manage test reports</p>
                    </div>
                  )}
                </div>

                <div
                  onClick={() => !userInfo && alert('Please log in to access this feature')}
                  className={`group glass hover:bg-purple-50 border border-blue-400 hover:border-purple-200 rounded-2xl p-6 hover:glow-blue transition-all duration-200 ${userInfo ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                >
                  {userInfo ? (
                    <Link href="/team-portal/invoices">
                      <div>
                        <CreditCard className="h-10 w-10 text-purple-300 mb-4 group-hover:scale-105 transition-transform duration-200" />
                        <h3 className="font-bold text-white mb-2">Invoices</h3>
                        <p className="text-sm text-white/90">Generate and send invoices</p>
                      </div>
                    </Link>
                  ) : (
                    <div>
                      <CreditCard className="h-10 w-10 text-purple-300 mb-4" />
                      <h3 className="font-bold text-white mb-2">Invoices</h3>
                      <p className="text-sm text-white/90">Generate and send invoices</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Getting Started */}
          {!hasData && (
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-200 rounded-xl p-8">
              <div className="flex items-start space-x-4">
                <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl">
                  <Activity className="h-8 w-8 text-blue-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Get Started with Your Team Portal</h3>
                  <p className="text-white/80 text-lg mb-6">
                    Start managing your backflow testing operations by adding customers and scheduling tests.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/team-portal/customers/new">
                      <Button className="glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl font-medium flex items-center">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add First Customer
                      </Button>
                    </Link>
                    <Link href="/team-portal/customers">
                      <Button className="glass hover:glass text-white/80 px-6 py-3 rounded-2xl font-medium flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        View All Customers
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts for Active Data */}
          {hasData && (stats.customers.needsService > 0 || stats.financials.overduePayments > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-2xl">
                  <AlertTriangle className="h-8 w-8 text-amber-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Attention Required</h3>
                  <p className="text-white/80 text-lg mb-4">
                    {stats.customers.needsService > 0 && `${stats.customers.needsService} customers need service. `}
                    {stats.financials.overduePayments > 0 && `${stats.financials.overduePayments} payments are overdue.`}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {stats.customers.needsService > 0 && (
                      <Link href="/team-portal/customers">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-medium">
                          Schedule Service
                        </Button>
                      </Link>
                    )}
                    {stats.financials.overduePayments > 0 && (
                      <Link href="/team-portal/invoices">
                        <Button className="glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl font-medium">
                          Review Invoices
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}