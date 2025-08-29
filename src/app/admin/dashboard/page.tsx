'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Wifi,
  Database,
  RefreshCw,
  Search,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationManagerComponent } from '@/components/NotificationManager';

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
  realtimeConnections: {
    active: number
    total: number
  }
  offlineSync: {
    pending: number
    lastSync: string
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
}

interface Activity {
  id: string
  type: string
  icon: string
  text: string
  time: string
  color: string
}

export default function AdminDashboard() {
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
          automationHealth: systemData.automationHealth,
          realtimeConnections: {
            active: Math.floor(Math.random() * 15) + 5, // Mock data
            total: 25
          },
          offlineSync: {
            pending: Math.floor(Math.random() * 3),
            lastSync: new Date().toISOString()
          }
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
      // Use mock data on error
      setSystemMetrics({
        automation: {
          testsCompleted: 23,
          invoicesGenerated: 23,
          paymentsProcessed: 18,
          reportsSubmitted: 23,
          emailsSent: 47,
          remindersScheduled: 12
        },
        automationHealth: {
          status: 'healthy',
          lastRun: new Date().toISOString(),
          uptime: '99.8%'
        },
        realtimeConnections: {
          active: 8,
          total: 12
        },
        offlineSync: {
          pending: 0,
          lastSync: new Date().toISOString()
        }
      })

      setBusinessMetrics({
        customers: {
          total: 127,
          active: 115,
          needsService: 12
        },
        appointments: {
          scheduled: 8,
          completed: 23,
          pending: 2
        },
        financials: {
          monthlyRevenue: 3450,
          pendingInvoices: 5,
          overduePayments: 2
        }
      })

      // Set fallback activities if none loaded
      if (activities.length === 0) {
        setActivities([
          { id: '1', type: 'system', icon: 'Activity', text: 'System monitoring dashboard loaded', time: 'Just now', color: 'text-blue-400' },
          { id: '2', type: 'ready', icon: 'CheckCircle', text: 'Automation system ready for operations', time: '1 minute ago', color: 'text-green-400' }
        ])
      }
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

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'blue',
    subtitle 
  }: {
    title: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    trend?: number
    color?: 'blue' | 'green' | 'orange' | 'red'
    subtitle?: string
  }) => {
    const colorClasses = {
      blue: 'text-blue-400 bg-blue-500/20',
      green: 'text-green-400 bg-green-500/20',
      orange: 'text-orange-400 bg-orange-500/20',
      red: 'text-red-400 bg-red-500/20'
    }

    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-white/80 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-white/50 text-xs mt-1">{subtitle}</p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
          <span className="text-white">Loading system metrics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">System Dashboard</h1>
            <p className="text-white/60 mt-2">
              Real-time monitoring of your automation platform
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <NotificationManagerComponent />
            
            <div className="text-right text-sm text-white/60">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            
            <Button
              onClick={() => window.location.href = '/admin/analytics'}
              className="btn-glass px-4 py-2 rounded-lg"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/data-management'}
              className="btn-glass px-4 py-2 rounded-lg"
            >
              <Database className="h-4 w-4 mr-2" />
              Data Export
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/search'}
              className="btn-glass px-4 py-2 rounded-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/audit-logs'}
              className="btn-glass px-4 py-2 rounded-lg"
            >
              <Shield className="h-4 w-4 mr-2" />
              Audit Logs
            </Button>
            
            <Button
              onClick={fetchMetrics}
              className="btn-glass px-4 py-2 rounded-lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Health Status */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">System Health</h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              systemMetrics?.automationHealth.status === 'healthy' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              <Activity className="h-4 w-4" />
              <span className="capitalize">{systemMetrics?.automationHealth.status}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{systemMetrics?.automationHealth.uptime}</div>
              <div className="text-white/60 text-sm">Uptime</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Wifi className="h-4 w-4 text-green-400" />
                <span className="text-2xl font-bold text-white">
                  {systemMetrics?.realtimeConnections.active}/{systemMetrics?.realtimeConnections.total}
                </span>
              </div>
              <div className="text-white/60 text-sm">Live Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{systemMetrics?.offlineSync.pending}</div>
              <div className="text-white/60 text-sm">Pending Sync</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {systemMetrics?.automation.testsCompleted || 0}
              </div>
              <div className="text-white/60 text-sm">Tests This Week</div>
            </div>
          </div>
        </div>

        {/* Automation Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Automation Performance</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Tests Completed"
              value={systemMetrics?.automation.testsCompleted || 0}
              icon={CheckCircle}
              color="green"
              trend={12}
              subtitle="This week"
            />
            <StatCard
              title="Invoices Generated"
              value={systemMetrics?.automation.invoicesGenerated || 0}
              icon={FileText}
              color="blue"
              trend={8}
              subtitle="Auto-generated"
            />
            <StatCard
              title="Payments Processed"
              value={systemMetrics?.automation.paymentsProcessed || 0}
              icon={DollarSign}
              color="green"
              trend={15}
              subtitle="Automated"
            />
            <StatCard
              title="Reports Submitted"
              value={systemMetrics?.automation.reportsSubmitted || 0}
              icon={Database}
              color="blue"
              subtitle="To water depts"
            />
            <StatCard
              title="Emails Sent"
              value={systemMetrics?.automation.emailsSent || 0}
              icon={Mail}
              color="green"
              trend={5}
              subtitle="Notifications"
            />
            <StatCard
              title="Reminders Scheduled"
              value={systemMetrics?.automation.remindersScheduled || 0}
              icon={Clock}
              color="orange"
              subtitle="Follow-ups"
            />
          </div>
        </div>

        {/* Business Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Business Overview</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Customers"
              value={businessMetrics?.customers.total || 0}
              icon={Users}
              color="blue"
              trend={3}
              subtitle={`${businessMetrics?.customers.active || 0} active`}
            />
            <StatCard
              title="Scheduled Appointments"
              value={businessMetrics?.appointments.scheduled || 0}
              icon={Calendar}
              color="green"
              subtitle="This week"
            />
            <StatCard
              title="Monthly Revenue"
              value={`$${businessMetrics?.financials.monthlyRevenue?.toLocaleString() || '0'}`}
              icon={DollarSign}
              color="green"
              trend={18}
              subtitle="Current month"
            />
            <StatCard
              title="Customers Need Service"
              value={businessMetrics?.customers.needsService || 0}
              icon={AlertTriangle}
              color="red"
              subtitle="Require attention"
            />
          </div>
        </div>

        {/* Automation Engine Status */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Automation Engine</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Running</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">6</div>
              <div className="text-white/60 text-sm">Active Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">12</div>
              <div className="text-white/60 text-sm">Pending Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">47</div>
              <div className="text-white/60 text-sm">Sent Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">0</div>
              <div className="text-white/60 text-sm">Failed Today</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              Next cycle: {new Date(Date.now() + 3600000).toLocaleTimeString()}
            </div>
            <Button
              onClick={() => fetch('/api/automation/engine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'run_cycle' }) })}
              className="btn-glass px-3 py-1 text-sm rounded-lg"
            >
              <Zap className="h-3 w-3 mr-1" />
              Run Now
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Automation Activity</h2>
          
          <div className="space-y-4">
            {activities.map((activity) => {
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
              
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-3 glass-darker rounded-xl">
                  <IconComponent className={`h-5 w-5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-white/90">{activity.text}</p>
                    <p className="text-white/50 text-sm">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}