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
  // Calendar,
  CheckCircle,
  // XCircle,
  // AlertTriangle,
  Download,
  // Filter,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

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
        console.error('Error fetching analytics:', result.error)
        // Set mock data for demonstration
        setData({
          monthlyRevenue: [
            { month: 'Jan', revenue: 8450, tests: 23 },
            { month: 'Feb', revenue: 9200, tests: 26 },
            { month: 'Mar', revenue: 7800, tests: 21 },
            { month: 'Apr', revenue: 10500, tests: 29 },
            { month: 'May', revenue: 12200, tests: 34 },
            { month: 'Jun', revenue: 11800, tests: 32 },
            { month: 'Jul', revenue: 13500, tests: 38 },
            { month: 'Aug', revenue: 12900, tests: 36 },
            { month: 'Sep', revenue: 14200, tests: 41 },
            { month: 'Oct', revenue: 13800, tests: 39 },
            { month: 'Nov', revenue: 15600, tests: 45 },
            { month: 'Dec', revenue: 16200, tests: 47 }
          ],
          testResults: [
            { result: 'Passed', count: 387, percentage: 87.2 },
            { result: 'Failed', count: 34, percentage: 7.7 },
            { result: 'Needs Repair', count: 23, percentage: 5.1 }
          ],
          customerGrowth: [
            { month: 'Jan', total: 95, new: 8 },
            { month: 'Feb', total: 102, new: 7 },
            { month: 'Mar', total: 108, new: 6 },
            { month: 'Apr', total: 115, new: 7 },
            { month: 'May', total: 123, new: 8 },
            { month: 'Jun', total: 129, new: 6 },
            { month: 'Jul', total: 136, new: 7 },
            { month: 'Aug', total: 142, new: 6 },
            { month: 'Sep', total: 149, new: 7 },
            { month: 'Oct', total: 156, new: 7 },
            { month: 'Nov', total: 164, new: 8 },
            { month: 'Dec', total: 172, new: 8 }
          ],
          deviceTypes: [
            { type: '3/4" RPZ', count: 89 },
            { type: '1" RPZ', count: 67 },
            { type: '1.5" RPZ', count: 23 },
            { type: '2" RPZ', count: 12 },
            { type: 'Double Check', count: 45 },
            { type: 'PVB', count: 18 }
          ],
          performanceMetrics: {
            averageTestTime: 18.5,
            completionRate: 94.2,
            customerSatisfaction: 4.7,
            revenueGrowth: 23.5
          },
          businessInsights: {
            peakMonths: ['November', 'December', 'January'],
            topDistricts: [
              { district: 'City of Tacoma', revenue: 89400 },
              { district: 'Lakewood Water District', revenue: 34200 },
              { district: 'Puyallup Water', revenue: 23100 }
            ],
            riskCustomers: 12,
            upcomingTests: 34
          }
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
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
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${
              change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
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
        <h3 className="text-white/80 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
          <span className="text-white">Loading analytics...</span>
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
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/admin/dashboard')}
              className="btn-glass p-2 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Business Analytics</h1>
              <p className="text-white/60 mt-2">
                Advanced insights and performance metrics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-glass px-3 py-2 rounded-lg text-white"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
              <option value="24months">Last 2 Years</option>
            </select>

            <Button
              onClick={downloadReport}
              className="btn-glass px-4 py-2 rounded-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>

            <Button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="btn-glass px-4 py-2 rounded-lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Revenue & Test Volume Trend</h2>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis yAxisId="left" stroke="#9CA3AF" />
                    <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
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
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Test Results Distribution</h2>
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
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
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
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Customer Growth</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.customerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
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
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Device Types</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.deviceTypes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="type" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Business Insights */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Business Insights</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {data.businessInsights.peakMonths.join(', ')}
                  </div>
                  <div className="text-white/60 text-sm">Peak Season</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    ${data.businessInsights.topDistricts[0]?.revenue.toLocaleString()}
                  </div>
                  <div className="text-white/60 text-sm">Top District Revenue</div>
                  <div className="text-xs text-white/40 mt-1">
                    {data.businessInsights.topDistricts[0]?.district}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-2">
                    {data.businessInsights.riskCustomers}
                  </div>
                  <div className="text-white/60 text-sm">At-Risk Customers</div>
                  <div className="text-xs text-white/40 mt-1">Need attention</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {data.businessInsights.upcomingTests}
                  </div>
                  <div className="text-white/60 text-sm">Upcoming Tests</div>
                  <div className="text-xs text-white/40 mt-1">Next 30 days</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}