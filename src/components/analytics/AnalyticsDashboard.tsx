'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Users, Calendar, CheckCircle, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react'
import MetricsCard from './MetricsCard'
import RevenueChart from './RevenueChart'

interface DashboardData {
  metrics: {
    revenue: {
      total: number
      thisMonth: number
      lastMonth: number
      growth: number
      trend: 'up' | 'down' | 'stable'
    }
    customers: {
      total: number
      active: number
      new: number
      retention: number
      churn: number
    }
    appointments: {
      total: number
      completed: number
      cancelled: number
      scheduled: number
      completionRate: number
    }
    tests: {
      total: number
      passed: number
      failed: number
      passRate: number
      averagePressureDrop: number
    }
    performance: {
      averageResponseTime: number
      appointmentUtilization: number
      customerSatisfaction: number
      revenuePerCustomer: number
    }
  }
  timeSeries: Array<{
    date: string
    revenue: number
    appointments: number
    newCustomers: number
    testsCompleted: number
  }>
  topCustomers: Array<{
    id: string
    name: string
    email: string
    totalSpent: number
    appointmentCount: number
    riskScore: number
  }>
  insights: {
    bottlenecks: string[]
    opportunities: string[]
    alerts: string[]
    recommendations: string[]
  }
  lastUpdated: string
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('30')
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/analytics/dashboard?timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const dashboardData = await response.json()
      setData(dashboardData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [timeframe])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Analytics Unavailable</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">
            Business insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timeframe selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          {/* Refresh button */}
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <TrendingUp className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Revenue"
          value={data.metrics.revenue.total}
          change={data.metrics.revenue.growth}
          changeLabel="vs last month"
          icon={DollarSign}
          iconColor="text-green-400"
          format="currency"
        />
        
        <MetricsCard
          title="Total Customers"
          value={data.metrics.customers.total}
          change={data.metrics.customers.new > 0 ? (data.metrics.customers.new / data.metrics.customers.total) * 100 : 0}
          changeLabel="new this month"
          icon={Users}
          iconColor="text-blue-400"
          format="number"
        />
        
        <MetricsCard
          title="Completion Rate"
          value={data.metrics.appointments.completionRate}
          icon={Calendar}
          iconColor="text-purple-400"
          format="percentage"
        />
        
        <MetricsCard
          title="Test Pass Rate"
          value={data.metrics.tests.passRate}
          icon={CheckCircle}
          iconColor="text-emerald-400"
          format="percentage"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={data.timeSeries} height={400} />

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Active Customers"
          value={data.metrics.customers.active}
          icon={Users}
          iconColor="text-blue-400"
          format="number"
        />
        
        <MetricsCard
          title="Avg Response Time"
          value={`${data.metrics.performance.averageResponseTime} days`}
          icon={TrendingUp}
          iconColor="text-orange-400"
        />
        
        <MetricsCard
          title="Revenue/Customer"
          value={data.metrics.performance.revenuePerCustomer}
          icon={DollarSign}
          iconColor="text-green-400"
          format="currency"
        />
        
        <MetricsCard
          title="Utilization"
          value={data.metrics.performance.appointmentUtilization}
          icon={Target}
          iconColor="text-purple-400"
          format="percentage"
        />
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Insights */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Business Insights
          </h3>
          
          <div className="space-y-4">
            {data.insights.opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <p className="text-green-100 text-sm">{opportunity}</p>
              </div>
            ))}
            
            {data.insights.bottlenecks.map((bottleneck, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                <p className="text-orange-100 text-sm">{bottleneck}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Top Customers
          </h3>
          
          <div className="space-y-3">
            {data.topCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{customer.name}</p>
                    <p className="text-slate-400 text-xs">{customer.appointmentCount} appointments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold text-sm">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(customer.totalSpent)}
                  </p>
                  {customer.riskScore > 50 && (
                    <p className="text-red-400 text-xs">High risk</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      {(data.insights.alerts.length > 0 || data.insights.recommendations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          {data.insights.alerts.length > 0 && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Action Required
              </h3>
              
              <div className="space-y-3">
                {data.insights.alerts.map((alert, index) => (
                  <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-100 text-sm">{alert}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.insights.recommendations.length > 0 && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Recommendations
              </h3>
              
              <div className="space-y-3">
                {data.insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-100 text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-slate-500 text-sm">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="w-64 h-8 bg-slate-700 rounded mb-2"></div>
        <div className="w-48 h-4 bg-slate-700 rounded"></div>
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-slate-700 rounded-lg"></div>
              <div className="w-6 h-6 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-20 h-4 bg-slate-700 rounded"></div>
              <div className="w-32 h-8 bg-slate-700 rounded"></div>
              <div className="w-24 h-4 bg-slate-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
        <div className="w-48 h-6 bg-slate-700 rounded mb-6"></div>
        <div className="w-full h-80 bg-slate-700 rounded"></div>
      </div>
    </div>
  )
}