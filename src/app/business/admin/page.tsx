'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Database,
  Users,
  Settings,
  FileText,
  Activity,
  Lock,
  AlertTriangle,
  CheckCircle,
  Server,
  BarChart3,
  UserCheck,
  RefreshCw,
  Download,
  Eye,
  Search,
  Filter
} from 'lucide-react';

interface AdminMetrics {
  users: {
    total: number;
    active: number;
    locked: number;
    recent_signups: number;
  };
  system: {
    uptime: string;
    performance: 'good' | 'warning' | 'critical';
    errors_24h: number;
    database_status: 'healthy' | 'warning' | 'error';
  };
  security: {
    failed_logins_24h: number;
    active_sessions: number;
    rls_status: 'enabled' | 'partial' | 'disabled';
  };
  business: {
    total_customers: number;
    total_revenue: number;
    active_subscriptions: number;
    support_tickets: number;
  };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  const loadAdminMetrics = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from admin APIs
      const mockMetrics: AdminMetrics = {
        users: {
          total: 1250,
          active: 1180,
          locked: 15,
          recent_signups: 45
        },
        system: {
          uptime: '99.9%',
          performance: 'good',
          errors_24h: 3,
          database_status: 'healthy'
        },
        security: {
          failed_logins_24h: 28,
          active_sessions: 156,
          rls_status: 'enabled'
        },
        business: {
          total_customers: 892,
          total_revenue: 125000,
          active_subscriptions: 67,
          support_tickets: 12
        }
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'healthy':
      case 'enabled':
        return 'text-emerald-300 bg-emerald-500/20 border-emerald-400';
      case 'warning':
      case 'partial':
        return 'text-yellow-300 bg-yellow-500/20 border-yellow-400';
      case 'critical':
      case 'error':
      case 'disabled':
        return 'text-red-300 bg-red-500/20 border-red-400';
      default:
        return 'text-gray-300 bg-gray-500/20 border-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-white/70">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Administration</h1>
          <p className="text-white/70 mt-2">Monitor and manage platform operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={loadAdminMetrics}
            variant="outline"
            size="sm"
            className="glass border-blue-400/50"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-black/30 rounded-xl p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'system', label: 'System Health', icon: Server },
          { id: 'reports', label: 'Reports', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/30 text-white border border-blue-400/50'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass border-blue-400/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{metrics?.users.total}</p>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs mt-1">
                      +{metrics?.users.recent_signups} this week
                    </Badge>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-emerald-400/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">System Health</p>
                    <p className="text-2xl font-bold text-white">{metrics?.system.uptime}</p>
                    <Badge className={`border-0 text-xs mt-1 ${getStatusColor(metrics?.system.performance || '')}`}>
                      {metrics?.system.performance}
                    </Badge>
                  </div>
                  <Activity className="h-8 w-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-yellow-400/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Security Status</p>
                    <p className="text-2xl font-bold text-white">{metrics?.security.failed_logins_24h}</p>
                    <Badge className={`border-0 text-xs mt-1 ${getStatusColor(metrics?.security.rls_status || '')}`}>
                      RLS {metrics?.security.rls_status}
                    </Badge>
                  </div>
                  <Shield className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-purple-400/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Active Sessions</p>
                    <p className="text-2xl font-bold text-white">{metrics?.security.active_sessions}</p>
                    <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs mt-1">
                      Live users
                    </Badge>
                  </div>
                  <UserCheck className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Management
                </CardTitle>
                <CardDescription className="text-white/70">Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Active Users:</span>
                    <span className="text-white">{metrics?.users.active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Locked Accounts:</span>
                    <span className="text-red-300">{metrics?.users.locked}</span>
                  </div>
                  <Button size="sm" className="w-full glass-btn-primary">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-emerald-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Health
                </CardTitle>
                <CardDescription className="text-white/70">Monitor database performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Status:</span>
                    <Badge className={`text-xs ${getStatusColor(metrics?.system.database_status || '')}`}>
                      {metrics?.system.database_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Errors (24h):</span>
                    <span className="text-white">{metrics?.system.errors_24h}</span>
                  </div>
                  <Button size="sm" className="w-full glass-btn-primary">
                    <Activity className="h-4 w-4 mr-2" />
                    View Logs
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-red-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Monitor
                </CardTitle>
                <CardDescription className="text-white/70">Track security events and threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Failed Logins:</span>
                    <span className="text-yellow-300">{metrics?.security.failed_logins_24h}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">RLS Status:</span>
                    <Badge className={`text-xs ${getStatusColor(metrics?.security.rls_status || '')}`}>
                      {metrics?.security.rls_status}
                    </Badge>
                  </div>
                  <Button size="sm" className="w-full glass-btn-primary">
                    <Lock className="h-4 w-4 mr-2" />
                    Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Metrics */}
          <Card className="glass border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white">Business Overview</CardTitle>
              <CardDescription className="text-white/70">Key business metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{metrics?.business.total_customers}</div>
                  <div className="text-white/60 text-sm">Total Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-300">${metrics?.business.total_revenue.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300">{metrics?.business.active_subscriptions}</div>
                  <div className="text-white/60 text-sm">Active Subscriptions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-300">{metrics?.business.support_tickets}</div>
                  <div className="text-white/60 text-sm">Open Tickets</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card className="glass border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white">User Management</CardTitle>
              <CardDescription className="text-white/70">Manage user accounts, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">User management features will be implemented here.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="glass border-red-400/30">
            <CardHeader>
              <CardTitle className="text-white">Security Dashboard</CardTitle>
              <CardDescription className="text-white/70">Monitor security events and configure security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">Security monitoring features will be implemented here.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card className="glass border-emerald-400/30">
            <CardHeader>
              <CardTitle className="text-white">System Health</CardTitle>
              <CardDescription className="text-white/70">Monitor system performance and health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">System health monitoring features will be implemented here.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card className="glass border-purple-400/30">
            <CardHeader>
              <CardTitle className="text-white">Admin Reports</CardTitle>
              <CardDescription className="text-white/70">Generate comprehensive system and business reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">Admin reporting features will be implemented here.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}