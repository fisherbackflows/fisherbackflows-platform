'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckCircle,
  Download,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUpIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AnalyticsData {
  monthlyRevenue: Array<{ month: string; revenue: number; tests: number }>
  testResults: Array<{ result: string; count: number; percentage: number }>
  customerGrowth: Array<{ month: string; total: number; new: number }>
  deviceTypes: Array<{ type: string; count: number }>
  performanceMetrics: {
    averageTestTime: number
    completionRate: number
    customerSatisfaction: number
    revenueGrowth: number
  }
  businessInsights: {
    peakMonths: string[]
    topDistricts: Array<{ district: string; revenue: number }>
    riskCustomers: number
    upcomingTests: number
  }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('12months')
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/admin/analytics?period=${dateRange}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        // No mock data - show empty state
        setData(null)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const downloadReport = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?period=${dateRange}&format=pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fisher-backflows-analytics-${dateRange}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string
    value: string | number
    change?: number
    icon: React.ComponentType<{ className?: string }>
    color?: 'blue' | 'green' | 'orange' | 'red'
  }) => {
    const colorClasses = {
      blue: 'text-blue-800 bg-blue-200',
      green: 'text-emerald-600 bg-emerald-50',
      orange: 'text-amber-600 bg-amber-50',
      red: 'text-red-800 bg-red-200'
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${
              change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-800' : 'text-slate-700'
            }`}>
              {change > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : change < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-slate-800 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-400">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-slate-800 mt-4">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-400">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Professional Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/admin/dashboard">
                  <Button className="bg-slate-300 hover:bg-slate-400 text-slate-700 p-2 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Business Analytics</h1>
                  <p className="text-slate-800 mt-2">
                    Advanced insights and performance metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Empty State */}
          <div className="text-center py-20">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
              <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Analytics Not Available</h2>
              <p className="text-slate-800 mb-8 max-w-md mx-auto">
                Analytics data will be available once you have customers, tests, and transactions in your system.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/admin/dashboard">
                  <Button className="bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                    Back to Dashboard
                  </Button>
                </Link>
                <Link href="/team-portal/customers/new">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg">
                    Add First Customer
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-400">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button className="bg-slate-300 hover:bg-slate-400 text-slate-700 p-2 rounded-lg">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Business Analytics</h1>
                <p className="text-slate-800 mt-2">
                  Advanced insights and performance metrics
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
                <option value="24months">Last 2 Years</option>
              </select>

              <Button
                onClick={downloadReport}
                className="bg-blue-700 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>

              <Button
                onClick={fetchAnalytics}
                disabled={refreshing}
                className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Key Performance Metrics */}
        {data && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Average Test Time"
                value={`${data.performanceMetrics.averageTestTime} min`}
                change={-12}
                icon={CheckCircle}
                color="green"
              />
              <MetricCard
                title="Completion Rate"
                value={`${data.performanceMetrics.completionRate}%`}
                change={5}
                icon={TrendingUp}
                color="blue"
              />
              <MetricCard
                title="Customer Satisfaction"
                value={`${data.performanceMetrics.customerSatisfaction}/5.0`}
                change={8}
                icon={Users}
                color="green"
              />
              <MetricCard
                title="Revenue Growth"
                value={`${data.performanceMetrics.revenueGrowth}%`}
                change={data.performanceMetrics.revenueGrowth}
                icon={DollarSign}
                color="green"
              />
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Trend */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Revenue & Test Volume Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.monthlyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis yAxisId="left" stroke="#64748B" />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: '#1E293B'
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue ($)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="tests"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorTests)"
                      name="Tests Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Test Results Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Test Results Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.testResults}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {data.testResults.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: '#1E293B'
                      }}
                      formatter={(value: string | number, name: string, props: any) => [
                        `${value} tests (${props?.payload?.percentage || '0'}%)`,
                        props?.payload?.result || name
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Customer Growth */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Customer Growth</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.customerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: '#1E293B'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Total Customers"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="new" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="New Customers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Device Types */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Device Types</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.deviceTypes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="type" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: '#1E293B'
                      }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Business Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Business Insights</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800 mb-2">
                    {data.businessInsights.peakMonths.join(', ')}
                  </div>
                  <div className="text-slate-800 text-sm">Peak Season</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-2">
                    ${data.businessInsights.topDistricts[0]?.revenue.toLocaleString()}
                  </div>
                  <div className="text-slate-800 text-sm">Top District Revenue</div>
                  <div className="text-xs text-slate-700 mt-1">
                    {data.businessInsights.topDistricts[0]?.district}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600 mb-2">
                    {data.businessInsights.riskCustomers}
                  </div>
                  <div className="text-slate-800 text-sm">At-Risk Customers</div>
                  <div className="text-xs text-slate-700 mt-1">Need attention</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {data.businessInsights.upcomingTests}
                  </div>
                  <div className="text-slate-800 text-sm">Upcoming Tests</div>
                  <div className="text-xs text-slate-700 mt-1">Next 30 days</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}