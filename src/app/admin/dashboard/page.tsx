'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminProtection from '@/components/auth/AdminProtection';
import { withErrorBoundary } from '@/components/error-boundaries';
import { 
  Activity,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Database,
  RefreshCw,
  Search,
  Shield,
  Home,
  Settings,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationManagerComponent } from '@/components/NotificationManager';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';

interface SystemMetrics {
  automation: {
    testsCompleted: number
    invoicesGenerated: number
    paymentsProcessed: number
    reportsSubmitted: number
    emailsSent: number
    remindersScheduled: number
  }
  automationHealth: {
    status: string
    lastRun: string
    uptime: string
  }
}

interface BusinessMetrics {
  customers: {
    total: number
    active: number
    needsService: number
  }
  appointments: {
    scheduled: number
    completed: number
    pending: number
  }
  financials: {
    monthlyRevenue: number
    pendingInvoices: number
    overduePayments: number
  }
  testing?: {
    totalTests: number
    passedTests: number
    failedTests: number
    passRate: number
  }
}

interface Activity {
  id: string
  type: string
  icon: string
  text: string
  time: string
  color?: string
}

function AdminDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchMetrics = useCallback(async () => {
    try {
      const [systemResponse, businessResponse, activityResponse] = await Promise.all([
        fetch('/api/automation/orchestrator?period=7'),
        fetch('/api/admin/metrics'),
        fetch('/api/admin/activity?limit=5')
      ])

      const systemData = await systemResponse.json()
      const businessData = await businessResponse.json()
      const activityData = await activityResponse.json()

      if (systemData.success) {
        setSystemMetrics({
          automation: systemData.metrics,
          automationHealth: systemData.automationHealth
        })
      }

      if (businessData.success) {
        setBusinessMetrics(businessData.metrics)
      }

      if (activityData.success) {
        setActivities(activityData.activities)
      }

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching metrics:', error)
      // Show real empty state instead of mock data
      setSystemMetrics({
        automation: {
          testsCompleted: 0,
          invoicesGenerated: 0,
          paymentsProcessed: 0,
          reportsSubmitted: 0,
          emailsSent: 0,
          remindersScheduled: 0
        },
        automationHealth: {
          status: 'initializing',
          lastRun: 'Never',
          uptime: '100%'
        }
      })

      setBusinessMetrics({
        customers: {
          total: 0,
          active: 0,
          needsService: 0
        },
        appointments: {
          scheduled: 0,
          completed: 0,
          pending: 0
        },
        financials: {
          monthlyRevenue: 0,
          pendingInvoices: 0,
          overduePayments: 0
        }
      })

      // Show empty state message
      setActivities([
        { id: '1', type: 'system', icon: 'Activity', text: 'System dashboard loaded - connect your data sources to see real metrics', time: 'Just now' }
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" color="blue" text="Loading admin dashboard..." />
      </div>
    )
  }

  return (
    <AdminProtection requiredRole="admin">
      <div className="min-h-screen bg-black">
        <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">System Control Center</h1>
                <p className="text-white/90 text-xl">Real business data and operational insights for Fisher Backflows</p>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationManagerComponent />
                <div className="text-sm text-white/90 glass px-3 py-2 rounded-2xl border">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
                <Button
                  onClick={fetchMetrics}
                  variant="outline"
                  size="sm"
                  className="border-blue-400 text-white/80 hover:glass"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        {/* Quick Actions */}
        <div className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => window.location.href = '/admin/analytics'}
              variant="outline"
              className="h-auto p-6 flex-col space-y-3 border-blue-200 hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl hover:border-blue-300 transition-all duration-200"
            >
              <TrendingUp className="h-8 w-8 text-blue-300" />
              <div className="text-center">
                <div className="font-semibold text-white">Analytics</div>
                <div className="text-sm text-white/90">View detailed reports</div>
              </div>
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/data-management'}
              variant="outline"
              className="h-auto p-6 flex-col space-y-3 border-green-200 hover:bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl hover:border-green-300 transition-all duration-200"
            >
              <Database className="h-8 w-8 text-green-300" />
              <div className="text-center">
                <div className="font-semibold text-white">Data Export</div>
                <div className="text-sm text-white/90">Manage data exports</div>
              </div>
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/search'}
              variant="outline"
              className="h-auto p-6 flex-col space-y-3 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
            >
              <Search className="h-8 w-8 text-purple-300" />
              <div className="text-center">
                <div className="font-semibold text-white">Search</div>
                <div className="text-sm text-white/90">Find records</div>
              </div>
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/audit-logs'}
              variant="outline"
              className="h-auto p-6 flex-col space-y-3 border-red-200 hover:bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl hover:border-red-300 transition-all duration-200"
            >
              <Shield className="h-8 w-8 text-red-300" />
              <div className="text-center">
                <div className="font-semibold text-white">Security</div>
                <div className="text-sm text-white/90">View audit logs</div>
              </div>
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="glass border border-blue-400 rounded-2xl glow-blue p-8 mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">Platform Status</h3>
              <p className="text-white/90 text-lg">Real business operations data</p>
            </div>
            <div className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-lg font-semibold border ${
              systemMetrics?.automationHealth.status === 'healthy' 
                ? 'glass border-green-400 text-green-300 glow-blue-sm' 
                : systemMetrics?.automationHealth.status === 'initializing'
                ? 'glass border-yellow-400 text-yellow-300 glow-blue-sm'
                : 'glass border-red-400 text-red-300 glow-blue-sm'
            }`}>
              <Activity className="h-6 w-6" />
              <span className="capitalize">{systemMetrics?.automationHealth.status || 'Loading'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-300 mb-3">{systemMetrics?.automationHealth.uptime || '100%'}</div>
              <div className="text-white/80 font-semibold">System Uptime</div>
              <div className="text-white/80 text-sm mt-1">Platform availability</div>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-400 glow-blue-sm border border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-emerald-300 mb-3">
                {systemMetrics?.automation.testsCompleted || 0}
              </div>
              <div className="text-white/80 font-semibold">Tests Completed</div>
              <div className="text-white/80 text-sm mt-1">Last 7 days</div>
            </div>
            <div className="bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-green-300 mb-3">
                {systemMetrics?.automation.invoicesGenerated || 0}
              </div>
              <div className="text-white/80 font-semibold">Invoices Generated</div>
              <div className="text-white/80 text-sm mt-1">Last 7 days</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-purple-300 mb-3">
                {systemMetrics?.automation.paymentsProcessed || 0}
              </div>
              <div className="text-white/80 font-semibold">Payments Processed</div>
              <div className="text-white/80 text-sm mt-1">Last 7 days</div>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <div className="mb-10">
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">Business Overview</h3>
            <p className="text-white/90 text-lg">Key business metrics and operational insights</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-200 rounded-xl p-6 text-center hover:glow-blue transition-shadow duration-200">
              <div className="inline-flex p-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl mb-4">
                <Users className="h-8 w-8 text-blue-300" />
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-2">{businessMetrics?.customers.total || 0}</div>
              <div className="text-white/80 font-semibold mb-1">Total Customers</div>
              <div className="text-white/80 text-sm">{businessMetrics?.customers.active || 0} active</div>
            </div>
            
            <div className="bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200 rounded-xl p-6 text-center hover:glow-blue transition-shadow duration-200">
              <div className="inline-flex p-3 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm rounded-2xl mb-4">
                <Calendar className="h-8 w-8 text-green-300" />
              </div>
              <div className="text-3xl font-bold text-green-700 mb-2">{businessMetrics?.appointments.scheduled || 0}</div>
              <div className="text-white/80 font-semibold mb-1">Scheduled Appointments</div>
              <div className="text-white/80 text-sm">This month</div>
            </div>
            
            <div className="bg-emerald-500/20 border border-emerald-400 glow-blue-sm border border-emerald-200 rounded-xl p-6 text-center hover:glow-blue transition-shadow duration-200">
              <div className="inline-flex p-3 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl mb-4">
                <DollarSign className="h-8 w-8 text-emerald-300" />
              </div>
              <div className="text-3xl font-bold text-emerald-700 mb-2">${businessMetrics?.financials.monthlyRevenue?.toLocaleString() || '0'}</div>
              <div className="text-white/80 font-semibold mb-1">Monthly Revenue</div>
              <div className="text-white/80 text-sm">Current month</div>
            </div>
            
            <div className="bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl border border-red-200 rounded-xl p-6 text-center hover:glow-blue transition-shadow duration-200">
              <div className="inline-flex p-3 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm rounded-2xl mb-4">
                <AlertTriangle className="h-8 w-8 text-red-300" />
              </div>
              <div className="text-3xl font-bold text-red-700 mb-2">{businessMetrics?.customers.needsService || 0}</div>
              <div className="text-white/80 font-semibold mb-1">Need Service</div>
              <div className="text-white/80 text-sm">Require attention</div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="glass border border-blue-400 rounded-2xl glow-blue p-8 mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Platform Activity Summary</h3>
              <p className="text-white/90">Overview of your business operations</p>
            </div>
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${
              (systemMetrics?.automation.testsCompleted || 0) > 0
                ? 'glass border-green-400 text-green-300 glow-blue-sm'
                : 'glass text-white/90 border-blue-400'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                (systemMetrics?.automation.testsCompleted || 0) > 0
                  ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl animate-pulse'
                  : 'glass'
              }`}></div>
              <span className="font-semibold">
                {(systemMetrics?.automation.testsCompleted || 0) > 0 ? 'Active' : 'Ready'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-300 mb-2">{systemMetrics?.automation.testsCompleted || 0}</div>
              <div className="text-white/80 font-semibold">Tests Completed</div>
              <div className="text-white/80 text-sm">Last 7 days</div>
            </div>
            <div className="bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-300 mb-2">{systemMetrics?.automation.invoicesGenerated || 0}</div>
              <div className="text-white/80 font-semibold">Invoices Created</div>
              <div className="text-white/80 text-sm">Last 7 days</div>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-400 glow-blue-sm border border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-emerald-300 mb-2">{systemMetrics?.automation.paymentsProcessed || 0}</div>
              <div className="text-white/80 font-semibold">Payments Received</div>
              <div className="text-white/80 text-sm">Last 7 days</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-300 mb-2">{systemMetrics?.automation.reportsSubmitted || 0}</div>
              <div className="text-white/80 font-semibold">Reports Submitted</div>
              <div className="text-white/80 text-sm">To water departments</div>
            </div>
          </div>

          {((systemMetrics?.automation.testsCompleted || 0) === 0 && 
            (systemMetrics?.automation.invoicesGenerated || 0) === 0 && 
            (systemMetrics?.automation.paymentsProcessed || 0) === 0) && (
            <div className="glass rounded-xl p-6 border border-blue-400 text-center">
              <div className="text-white/90 mb-4">
                <Database className="h-12 w-12 text-white/90 mx-auto mb-3" />
                <p className="text-lg font-semibold">No Data Available Yet</p>
                <p className="text-sm">Once you start using the platform, your real business metrics will appear here.</p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <Button variant="outline" asChild>
                  <Link href="/team-portal/customers/new">
                    <Users className="h-4 w-4 mr-2" />
                    Add Customer
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/team-portal/schedule/new">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Test
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass border border-blue-400 rounded-2xl glow-blue p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Recent Business Activity</h3>
            <p className="text-white/90">Latest real business operations and transactions</p>
          </div>
          
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => {
                // Map icon names to components
                const getIcon = (iconName: string) => {
                  switch (iconName) {
                    case 'CheckCircle': return CheckCircle
                    case 'Mail': return Mail
                    case 'DollarSign': return DollarSign
                    case 'Database': return Database
                    case 'Clock': return Clock
                    case 'Calendar': return Calendar
                    case 'Activity': return Activity
                    default: return CheckCircle
                  }
                }
                
                const IconComponent = getIcon(activity.icon)
                const iconColorClass = activity.type === 'test_completed' 
                  ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm text-green-300'
                  : activity.type === 'payment_received'
                  ? 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-emerald-300'
                  : activity.type === 'invoice_sent'
                  ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm text-blue-300'
                  : 'glass text-white/90'
                
                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 glass rounded-xl border border-blue-400 hover:glass transition-colors duration-200">
                    <div className={`p-2 rounded-2xl ${iconColorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.text}</p>
                      <p className="text-white/80 text-sm">{activity.time}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex p-4 glass rounded-full mb-4">
                  <Activity className="h-8 w-8 text-white/80" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">No Business Activity Yet</h4>
                <p className="text-white/90 mb-6">Once you start conducting tests, sending invoices, and processing payments, your activity will appear here</p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" asChild>
                    <Link href="/field/dashboard">
                      <Wrench className="h-4 w-4 mr-2" />
                      Field Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/team-portal/invoices/new">
                      <FileText className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </AdminProtection>
  )
}

// Export the component directly to fix TypeScript build error
export default AdminDashboard;