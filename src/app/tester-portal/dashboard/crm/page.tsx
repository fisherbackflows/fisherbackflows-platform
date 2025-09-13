'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Calendar,
  DollarSign,
  ClipboardCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  BarChart3,
  Activity,
  Target,
  Zap
} from 'lucide-react'

interface DashboardStats {
  totalCustomers: number
  activeDevices: number
  monthlyRevenue: number
  testsCompleted: number
  upcomingTests: number
  overdueTests: number
  newLeads: number
  conversionRate: number
}

interface RecentActivity {
  id: string
  type: 'test_completed' | 'customer_added' | 'invoice_paid' | 'appointment_scheduled'
  description: string
  timestamp: string
  customer?: string
}

interface UpcomingAppointment {
  id: string
  customer_name: string
  device_location: string
  scheduled_date: string
  test_type: string
  priority: 'high' | 'medium' | 'low'
}

export default function TesterPortalCRMDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeDevices: 0,
    monthlyRevenue: 0,
    testsCompleted: 0,
    upcomingTests: 0,
    overdueTests: 0,
    newLeads: 0,
    conversionRate: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Mock data for now - will be replaced with real API calls
      setStats({
        totalCustomers: 247,
        activeDevices: 1,
        monthlyRevenue: 18750,
        testsCompleted: 89,
        upcomingTests: 23,
        overdueTests: 5,
        newLeads: 12,
        conversionRate: 68
      })

      setRecentActivity([
        {
          id: '1',
          type: 'test_completed',
          description: 'Completed annual test for ABC Manufacturing',
          timestamp: '2025-01-12T10:30:00Z',
          customer: 'ABC Manufacturing'
        },
        {
          id: '2',
          type: 'customer_added',
          description: 'New customer registration: Fisher Industries',
          timestamp: '2025-01-12T09:15:00Z',
          customer: 'Fisher Industries'
        },
        {
          id: '3',
          type: 'invoice_paid',
          description: 'Payment received: $150 from Metro Apartments',
          timestamp: '2025-01-11T16:45:00Z',
          customer: 'Metro Apartments'
        }
      ])

      setUpcomingAppointments([
        {
          id: '1',
          customer_name: 'Downtown Plaza',
          device_location: 'Main Building - Basement',
          scheduled_date: '2025-01-13T09:00:00Z',
          test_type: 'Annual Test',
          priority: 'high'
        },
        {
          id: '2',
          customer_name: 'Green Valley School',
          device_location: 'Cafeteria Kitchen',
          scheduled_date: '2025-01-13T14:30:00Z',
          test_type: 'Repair Verification',
          priority: 'medium'
        }
      ])

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'test_completed': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'customer_added': return <Users className="h-4 w-4 text-blue-400" />
      case 'invoice_paid': return <DollarSign className="h-4 w-4 text-emerald-400" />
      case 'appointment_scheduled': return <Calendar className="h-4 w-4 text-purple-400" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/20'
      case 'low': return 'text-green-400 bg-green-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <header className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">CRM Dashboard</h1>
                <p className="text-cyan-400">Tester Portal - Business Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/tester-portal/customers/new"
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Customer</span>
              </Link>
              <Link
                href="/tester-portal"
                className="text-cyan-400 hover:text-white transition-colors"
              >
                Back to API Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-white">{stats.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-cyan-400" />
            </div>
            <p className="text-green-400 text-sm mt-2">+12% from last month</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-green-400 text-sm mt-2">+8% from last month</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Tests Completed</p>
                <p className="text-3xl font-bold text-white">{stats.testsCompleted}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-green-400 text-sm mt-2">{stats.upcomingTests} upcoming</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Conversion Rate</p>
                <p className="text-3xl font-bold text-white">{stats.conversionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-green-400 text-sm mt-2">{stats.newLeads} new leads</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
              <Link href="/tester-portal/activity" className="text-cyan-400 hover:text-white text-sm">
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-white/60 text-xs mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
            
            <div className="space-y-3">
              <Link
                href="/tester-portal/customers"
                className="block w-full p-3 bg-cyan-600/20 border border-cyan-400/30 rounded-lg text-cyan-300 hover:bg-cyan-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4" />
                  <span>Manage Customers</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/schedule"
                className="block w-full p-3 bg-blue-600/20 border border-blue-400/30 rounded-lg text-blue-300 hover:bg-blue-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Tests</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/devices"
                className="block w-full p-3 bg-purple-600/20 border border-purple-400/30 rounded-lg text-purple-300 hover:bg-purple-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Zap className="h-4 w-4" />
                  <span>Device Management</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/invoices"
                className="block w-full p-3 bg-emerald-600/20 border border-emerald-400/30 rounded-lg text-emerald-300 hover:bg-emerald-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4" />
                  <span>Create Invoice</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/invoices"
                className="block w-full p-3 bg-emerald-600/20 border border-emerald-400/30 rounded-lg text-emerald-300 hover:bg-emerald-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4" />
                  <span>Invoice Management</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/reports"
                className="block w-full p-3 bg-purple-600/20 border border-purple-400/30 rounded-lg text-purple-300 hover:bg-purple-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Business Reports</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/automation"
                className="block w-full p-3 bg-yellow-600/20 border border-yellow-400/30 rounded-lg text-yellow-300 hover:bg-yellow-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Zap className="h-4 w-4" />
                  <span>Workflow Automation</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/leads"
                className="block w-full p-3 bg-indigo-600/20 border border-indigo-400/30 rounded-lg text-indigo-300 hover:bg-indigo-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4" />
                  <span>Lead Management</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/marketing"
                className="block w-full p-3 bg-pink-600/20 border border-pink-400/30 rounded-lg text-pink-300 hover:bg-pink-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4" />
                  <span>Marketing Campaigns</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/pipeline"
                className="block w-full p-3 bg-orange-600/20 border border-orange-400/30 rounded-lg text-orange-300 hover:bg-orange-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Target className="h-4 w-4" />
                  <span>Sales Pipeline</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/analytics"
                className="block w-full p-3 bg-slate-600/20 border border-slate-400/30 rounded-lg text-slate-300 hover:bg-slate-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-4 w-4" />
                  <span>Advanced Analytics</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/collaboration"
                className="block w-full p-3 bg-teal-600/20 border border-teal-400/30 rounded-lg text-teal-300 hover:bg-teal-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4" />
                  <span>Team Collaboration</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/territories"
                className="block w-full p-3 bg-green-600/20 border border-green-400/30 rounded-lg text-green-300 hover:bg-green-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4" />
                  <span>Territory Management</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/workflows"
                className="block w-full p-3 bg-amber-600/20 border border-amber-400/30 rounded-lg text-amber-300 hover:bg-amber-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Zap className="h-4 w-4" />
                  <span>Advanced Workflows</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tester-portal/integrations"
                className="block w-full p-3 bg-violet-600/20 border border-violet-400/30 rounded-lg text-violet-300 hover:bg-violet-600/30 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4" />
                  <span>API Integrations</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Today's Schedule</h3>
            <Link
              href="/tester-portal/schedule"
              className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors text-sm"
            >
              View Full Schedule
            </Link>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{appointment.customer_name}</h4>
                      <p className="text-white/60 text-sm flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span>{appointment.device_location}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">
                      {new Date(appointment.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                      {appointment.test_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-cyan-400/50 mx-auto mb-4" />
              <p className="text-white/60">No appointments scheduled for today</p>
              <Link
                href="/tester-portal/schedule/new"
                className="inline-block mt-3 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                Schedule an appointment
              </Link>
            </div>
          )}
        </div>

        {/* Alert Bar for Overdue Tests */}
        {stats.overdueTests > 0 && (
          <div className="mt-6 bg-red-500/20 border border-red-400/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-red-300 font-medium">
                  {stats.overdueTests} overdue test{stats.overdueTests !== 1 ? 's' : ''} require attention
                </p>
                <p className="text-red-400/80 text-sm">Contact customers to reschedule immediately</p>
              </div>
            </div>
            <Link
              href="/tester-portal/schedule?filter=overdue"
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
            >
              View Overdue
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}