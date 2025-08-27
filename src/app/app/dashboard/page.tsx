'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import StandardHeader from '@/components/ui/StandardHeader';
import Logo from '@/components/ui/Logo';
import { 
  Users, 
  Calendar,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Settings,
  LogOut,
  TrendingUp,
  Bell,
  User
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  todayTests: number;
  weekTests: number;
  pendingReports: number;
  monthRevenue: number;
}

interface TeamUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<TeamUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayTests: 0,
    weekTests: 0,
    pendingReports: 0,
    monthRevenue: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    // Check authentication and role
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.role !== 'admin') {
            router.push('/app');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/app');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/app');
      }
    };

    checkAuth();

    // Load dashboard stats (mock data for now)
    setStats({
      todayTests: 8,
      weekTests: 32,
      pendingReports: 3,
      monthRevenue: 4250
    });

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/team/auth/logout', { method: 'POST' });
      router.push('/app');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add/remove team members',
      icon: <Users className="h-8 w-8" />,
      href: '/app/users',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'View All Tests',
      description: 'Review test reports',
      icon: <FileText className="h-8 w-8" />,
      href: '/app/test-reports',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Schedule Management',
      description: 'Assign routes & appointments',
      icon: <Calendar className="h-8 w-8" />,
      href: '/app/schedule-admin',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Reports & Analytics',
      description: 'Business insights',
      icon: <TrendingUp className="h-8 w-8" />,
      href: '/app/analytics',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  const pendingActions = [
    {
      title: '2 Time-off Requests',
      description: 'Pending approval',
      icon: <Calendar className="h-6 w-6" />,
      href: '/app/time-off',
      urgency: 'medium'
    },
    {
      title: '3 Reports Need Review',
      description: 'Quality control check',
      icon: <FileText className="h-6 w-6" />,
      href: '/app/reports-review',
      urgency: 'medium'
    },
    {
      title: '1 New Tester Registration',
      description: 'Activate account',
      icon: <User className="h-6 w-6" />,
      href: '/app/users?filter=pending',
      urgency: 'high'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
      
      <StandardHeader variant="portal">
        <div className="flex justify-between items-center">
          <Logo width={200} height={160} priority />
          <div className="flex items-center gap-4">
            <div className="glass rounded-lg px-3 py-2">
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
            <div className="glass rounded-lg px-3 py-2">
              <span className="text-white/80 text-sm">
                Welcome, {user.first_name}
              </span>
            </div>
            <Button
              onClick={handleLogout}
              className="btn-glass px-4 py-2 rounded-lg hover-glow flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </StandardHeader>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{stats.todayTests}</div>
                  <div className="text-blue-300 text-sm">Today's Tests</div>
                </div>
                <div className="glass-blue rounded-lg p-3">
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-6 glow-green-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{stats.weekTests}</div>
                  <div className="text-green-300 text-sm">This Week</div>
                </div>
                <div className="glass-green rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-6 glow-yellow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{stats.pendingReports}</div>
                  <div className="text-yellow-300 text-sm">Pending</div>
                </div>
                <div className="glass-yellow rounded-lg p-3">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-6 glow-emerald-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">${stats.monthRevenue.toLocaleString()}</div>
                  <div className="text-emerald-300 text-sm">Monthly Revenue</div>
                </div>
                <div className="glass-emerald rounded-lg p-3">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
              <div className="text-white/60 text-sm">Full system access</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="group glass rounded-xl p-6 card-hover"
                >
                  <div className="text-center">
                    <div className="inline-block glass-blue rounded-full p-4 mb-4 pulse-glow">
                      {action.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                    <p className="text-white/60 text-sm">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Pending Actions */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Needs Attention</h2>
            
            {pendingActions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pendingActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="glass rounded-xl p-6 card-hover"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`glass-${action.urgency === 'high' ? 'red' : 'yellow'} rounded-lg p-3`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {action.title}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p className="text-white/80">All caught up!</p>
                <p className="text-white/50 text-sm">No pending admin actions</p>
              </div>
            )}
          </section>

          {/* System Overview */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6">System Overview</h2>
            <div className="glass rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">5</div>
                  <div className="text-white/80 text-sm">Active Testers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">127</div>
                  <div className="text-white/80 text-sm">Tests This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">98.5%</div>
                  <div className="text-white/80 text-sm">Pass Rate</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}