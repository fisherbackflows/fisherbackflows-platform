'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  Shield,
  Building,
  MapPin,
  Phone
} from 'lucide-react';

export default function BusinessDashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeDevices: 0,
    upcomingAppointments: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    completedTests: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dashboard stats
    const loadStats = async () => {
      try {
        // This will be replaced with actual API calls
        setStats({
          totalCustomers: 324,
          activeDevices: 782,
          upcomingAppointments: 42,
          monthlyRevenue: 28750,
          pendingInvoices: 8,
          completedTests: 156
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-500/5" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Business Dashboard</h1>
              <p className="text-white/60">Manage your backflow testing business</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-blue-400 text-white/80">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" className="border-blue-400 text-white/80">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          {/* Total Customers */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 border border-blue-400 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-300" />
              </div>
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-400 text-blue-200 text-xs font-semibold rounded-full">
                ACTIVE
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.totalCustomers}</h3>
            <p className="text-white/80 font-medium">Total Customers</p>
            <Link href="/business/customers" className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center">
              Manage <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          {/* Active Devices */}
          <div className="glass border border-emerald-400/50 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-300" />
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-semibold rounded-full">
                PROTECTED
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.activeDevices}</h3>
            <p className="text-white/80 font-medium">Active Devices</p>
            <p className="text-white/60 text-sm mt-2">Under management</p>
          </div>

          {/* Upcoming Appointments */}
          <div className="glass border border-amber-400/50 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 border border-amber-400 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-300" />
              </div>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-semibold rounded-full">
                THIS WEEK
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.upcomingAppointments}</h3>
            <p className="text-white/80 font-medium">Upcoming Tests</p>
            <Link href="/business/schedule" className="mt-2 text-amber-400 hover:text-amber-300 text-sm flex items-center">
              View Schedule <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          {/* Monthly Revenue */}
          <div className="glass border border-green-400/50 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 border border-green-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-300" />
              </div>
              <span className="px-3 py-1 bg-green-500/20 border border-green-400 text-green-200 text-xs font-semibold rounded-full">
                THIS MONTH
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">${stats.monthlyRevenue.toLocaleString()}</h3>
            <p className="text-white/80 font-medium">Monthly Revenue</p>
            <Link href="/business/analytics" className="mt-2 text-green-400 hover:text-green-300 text-sm flex items-center">
              View Analytics <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          {/* Pending Invoices */}
          <div className="glass border border-red-400/50 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 border border-red-400 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-red-300" />
              </div>
              <span className="px-3 py-1 bg-red-500/20 border border-red-400 text-red-200 text-xs font-semibold rounded-full">
                PENDING
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.pendingInvoices}</h3>
            <p className="text-white/80 font-medium">Pending Invoices</p>
            <Link href="/business/invoices" className="mt-2 text-red-400 hover:text-red-300 text-sm flex items-center">
              Review <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          {/* Completed Tests */}
          <div className="glass border border-purple-400/50 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 border border-purple-400 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-300" />
              </div>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-400 text-purple-200 text-xs font-semibold rounded-full">
                THIS MONTH
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.completedTests}</h3>
            <p className="text-white/80 font-medium">Tests Completed</p>
            <Link href="/business/reports" className="mt-2 text-purple-400 hover:text-purple-300 text-sm flex items-center">
              View Reports <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Primary Actions */}
          <div className="lg:col-span-2">
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                <Link href="/business/customers/new">
                  <div className="p-4 bg-blue-500/20 border border-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors text-center">
                    <PlusCircle className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                    <h3 className="font-semibold text-white text-sm">Add Customer</h3>
                  </div>
                </Link>

                <Link href="/business/schedule/new">
                  <div className="p-4 bg-amber-500/20 border border-amber-400 rounded-xl hover:bg-amber-500/30 transition-colors text-center">
                    <Calendar className="h-8 w-8 text-amber-300 mx-auto mb-2" />
                    <h3 className="font-semibold text-white text-sm">Schedule Test</h3>
                  </div>
                </Link>

                <Link href="/business/invoices/new">
                  <div className="p-4 bg-green-500/20 border border-green-400 rounded-xl hover:bg-green-500/30 transition-colors text-center">
                    <CreditCard className="h-8 w-8 text-green-300 mx-auto mb-2" />
                    <h3 className="font-semibold text-white text-sm">Create Invoice</h3>
                  </div>
                </Link>

                <Link href="/business/reports">
                  <div className="p-4 bg-purple-500/20 border border-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors text-center">
                    <FileText className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                    <h3 className="font-semibold text-white text-sm">Test Reports</h3>
                  </div>
                </Link>

                <Link href="/business/analytics">
                  <div className="p-4 bg-emerald-500/20 border border-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors text-center">
                    <BarChart3 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                    <h3 className="font-semibold text-white text-sm">Analytics</h3>
                  </div>
                </Link>

                <Link href="/business/settings">
                  <div className="p-4 bg-gray-500/20 border border-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors text-center">
                    <Settings className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <h3 className="font-semibold text-white text-sm">Settings</h3>
                  </div>
                </Link>

              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
              <div className="space-y-4">

                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Test completed for John Smith</p>
                    <p className="text-white/60 text-xs">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">New customer registration</p>
                    <p className="text-white/60 text-xs">4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Invoice #1247 sent</p>
                    <p className="text-white/60 text-xs">6 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">District report submitted</p>
                    <p className="text-white/60 text-xs">1 day ago</p>
                  </div>
                </div>

              </div>

              <Link href="/business/activity" className="mt-4 text-blue-400 hover:text-blue-300 text-sm flex items-center">
                View All Activity <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}