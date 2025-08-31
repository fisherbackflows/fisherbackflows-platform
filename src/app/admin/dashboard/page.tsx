'use client';

import { useState, useEffect, useCallback } from 'react';
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
import Logo from '@/components/ui/Logo';

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" color="blue" text="Loading admin dashboard..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <Logo width={160} height={128} />
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Fisher Backflows</h1>
                  <p className="text-xs text-slate-600">Admin Portal</p>
                </div>
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/admin/dashboard" className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  <Home className="h-4 w-4 mr-2 inline" />
                  Dashboard
                </Link>
                <Link href="/admin/analytics" className="px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors">
                  <TrendingUp className="h-4 w-4 mr-2 inline" />
                  Analytics
                </Link>
                <Link href="/admin/data-management" className="px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors">
                  <Database className="h-4 w-4 mr-2 inline" />
                  Data Export
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationManagerComponent />
              <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button
                onClick={fetchMetrics}
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">System Control Center</h2>
            <p className="text-slate-600 text-xl">
              Real business data and operational insights for Fisher Backflows
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => window.location.href = '/admin/analytics'}
              variant="outline"
              className="h-auto p-6 flex-col space-y-3 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
            >
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold text-slate-900">Analytics</div>
                <div className="text-sm text-slate-600">View detailed reports</div>
              </div>
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/data-management'}
              variant="outline"
              className="h-auto p-6 flex-col space-y-3 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
            >
              <Database className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-semibold text-slate-900">Data Export</div>
                <div className="text-sm text-slate-600">Manage data exports</div>
              </div>
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/search'}
              variant="outline"
              className="h-auto p-6 flex-col space-y-3 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
            >
              <Search className="h-8 w-8 text-purple-600" />
              <div className="text-center">
                <div className="font-semibold text-slate-900">Search</div>
                <div className="text-sm text-slate-600">Find records</div>
              </div>
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/audit-logs'}
              variant="outline"
              className="h-auto p-6 flex-col space-y-3 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
            >
              <Shield className="h-8 w-8 text-red-600" />
              <div className="text-center">
                <div className="font-semibold text-slate-900">Security</div>
                <div className="text-sm text-slate-600">View audit logs</div>
              </div>
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Platform Status</h3>
              <p className="text-slate-600 text-lg">Real business operations data</p>
            </div>
            <div className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-lg font-semibold border ${
              systemMetrics?.automationHealth.status === 'healthy' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : systemMetrics?.automationHealth.status === 'initializing'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <Activity className="h-6 w-6" />
              <span className="capitalize">{systemMetrics?.automationHealth.status || 'Loading'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-3">{systemMetrics?.automationHealth.uptime || '100%'}</div>
              <div className="text-slate-700 font-semibold">System Uptime</div>
              <div className="text-slate-500 text-sm mt-1">Platform availability</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-3">
                {systemMetrics?.automation.testsCompleted || 0}
              </div>
              <div className="text-slate-700 font-semibold">Tests Completed</div>
              <div className="text-slate-500 text-sm mt-1">Last 7 days</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-green-600 mb-3">
                {systemMetrics?.automation.invoicesGenerated || 0}
              </div>
              <div className="text-slate-700 font-semibold">Invoices Generated</div>
              <div className="text-slate-500 text-sm mt-1">Last 7 days</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-3">
                {systemMetrics?.automation.paymentsProcessed || 0}
              </div>
              <div className="text-slate-700 font-semibold">Payments Processed</div>
              <div className="text-slate-500 text-sm mt-1">Last 7 days</div>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <div className="mb-10">
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Business Overview</h3>
            <p className="text-slate-600 text-lg">Key business metrics and operational insights</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-200">
              <div className="inline-flex p-3 bg-blue-100 rounded-lg mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-2">{businessMetrics?.customers.total || 0}</div>
              <div className="text-slate-700 font-semibold mb-1">Total Customers</div>
              <div className="text-slate-500 text-sm">{businessMetrics?.customers.active || 0} active</div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-200">
              <div className="inline-flex p-3 bg-green-100 rounded-lg mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-700 mb-2">{businessMetrics?.appointments.scheduled || 0}</div>
              <div className="text-slate-700 font-semibold mb-1">Scheduled Appointments</div>
              <div className="text-slate-500 text-sm">This month</div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-200">
              <div className="inline-flex p-3 bg-emerald-100 rounded-lg mb-4">
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-700 mb-2">${businessMetrics?.financials.monthlyRevenue?.toLocaleString() || '0'}</div>
              <div className="text-slate-700 font-semibold mb-1">Monthly Revenue</div>
              <div className="text-slate-500 text-sm">Current month</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-200">
              <div className="inline-flex p-3 bg-red-100 rounded-lg mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-700 mb-2">{businessMetrics?.customers.needsService || 0}</div>
              <div className="text-slate-700 font-semibold mb-1">Need Service</div>
              <div className="text-slate-500 text-sm">Require attention</div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Platform Activity Summary</h3>
              <p className="text-slate-600">Overview of your business operations</p>
            </div>
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${
              (systemMetrics?.automation.testsCompleted || 0) > 0
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                (systemMetrics?.automation.testsCompleted || 0) > 0
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-slate-400'
              }`}></div>
              <span className="font-semibold">
                {(systemMetrics?.automation.testsCompleted || 0) > 0 ? 'Active' : 'Ready'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{systemMetrics?.automation.testsCompleted || 0}</div>
              <div className="text-slate-700 font-semibold">Tests Completed</div>
              <div className="text-slate-500 text-sm">Last 7 days</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{systemMetrics?.automation.invoicesGenerated || 0}</div>
              <div className="text-slate-700 font-semibold">Invoices Created</div>
              <div className="text-slate-500 text-sm">Last 7 days</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">{systemMetrics?.automation.paymentsProcessed || 0}</div>
              <div className="text-slate-700 font-semibold">Payments Received</div>
              <div className="text-slate-500 text-sm">Last 7 days</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{systemMetrics?.automation.reportsSubmitted || 0}</div>
              <div className="text-slate-700 font-semibold">Reports Submitted</div>
              <div className="text-slate-500 text-sm">To water departments</div>
            </div>
          </div>

          {((systemMetrics?.automation.testsCompleted || 0) === 0 && 
            (systemMetrics?.automation.invoicesGenerated || 0) === 0 && 
            (systemMetrics?.automation.paymentsProcessed || 0) === 0) && (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <div className="text-slate-600 mb-4">
                <Database className="h-12 w-12 text-slate-400 mx-auto mb-3" />
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
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Recent Business Activity</h3>
            <p className="text-slate-600">Latest real business operations and transactions</p>
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
                  ? 'bg-green-100 text-green-600'
                  : activity.type === 'payment_received'
                  ? 'bg-emerald-100 text-emerald-600'
                  : activity.type === 'invoice_sent'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-600'
                
                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors duration-200">
                    <div className={`p-2 rounded-lg ${iconColorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900 font-medium">{activity.text}</p>
                      <p className="text-slate-500 text-sm">{activity.time}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                  <Activity className="h-8 w-8 text-slate-500" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">No Business Activity Yet</h4>
                <p className="text-slate-600 mb-6">Once you start conducting tests, sending invoices, and processing payments, your activity will appear here</p>
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
  )
}

// Wrap with error boundary
export default withErrorBoundary(AdminDashboard, {
  pageName: 'Admin Dashboard',
  showDebugInfo: true
});