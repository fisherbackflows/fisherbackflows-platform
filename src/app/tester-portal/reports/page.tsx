'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Search,
  ArrowLeft,
  Users,
  DollarSign,
  Clock,
  Target,
  FileText,
  PieChart,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ReportData {
  revenue: {
    thisMonth: number
    lastMonth: number
    growth: number
    quarterly: number[]
  }
  customers: {
    total: number
    active: number
    newThisMonth: number
    retention: number
  }
  tests: {
    completed: number
    pending: number
    overdue: number
    passRate: number
  }
  efficiency: {
    avgResponseTime: number
    completionRate: number
    customerSatisfaction: number
  }
}

interface ChartData {
  month: string
  revenue: number
  tests: number
}

export default function TesterPortalReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month')
  const [selectedReport, setSelectedReport] = useState<string>('overview')

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockData: ReportData = {
        revenue: {
          thisMonth: 18750,
          lastMonth: 16200,
          growth: 15.7,
          quarterly: [45000, 52000, 58000, 62000]
        },
        customers: {
          total: 247,
          active: 186,
          newThisMonth: 12,
          retention: 92.5
        },
        tests: {
          completed: 89,
          pending: 23,
          overdue: 5,
          passRate: 96.8
        },
        efficiency: {
          avgResponseTime: 2.3,
          completionRate: 94.5,
          customerSatisfaction: 4.7
        }
      }

      const mockChartData: ChartData[] = [
        { month: 'Jul', revenue: 15200, tests: 45 },
        { month: 'Aug', revenue: 18600, tests: 58 },
        { month: 'Sep', revenue: 16200, tests: 52 },
        { month: 'Oct', revenue: 19800, tests: 67 },
        { month: 'Nov', revenue: 17400, tests: 61 },
        { month: 'Dec', revenue: 21300, tests: 73 },
        { month: 'Jan', revenue: 18750, tests: 89 }
      ]

      setReportData(mockData)
      setChartData(mockChartData)
    } catch (error) {
      console.error('Failed to fetch report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-400' : 'text-red-400'
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/80">Failed to load report data</p>
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
              <Link href="/tester-portal/dashboard/crm" className="text-cyan-400 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Business Reports & Analytics</h1>
                  <p className="text-cyan-400">Comprehensive business insights</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="month" className="bg-slate-800">This Month</option>
                <option value="quarter" className="bg-slate-800">This Quarter</option>
                <option value="year" className="bg-slate-800">This Year</option>
              </select>
              <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className={`flex items-center space-x-1 ${getGrowthColor(reportData.revenue.growth)}`}>
                {getGrowthIcon(reportData.revenue.growth)}
                <span className="text-sm font-medium">{formatPercentage(reportData.revenue.growth)}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(reportData.revenue.thisMonth)}</p>
            <p className="text-sm text-cyan-300 mt-2">
              vs {formatCurrency(reportData.revenue.lastMonth)} last month
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{reportData.customers.newThisMonth}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Active Customers</h3>
            <p className="text-3xl font-bold text-white">{reportData.customers.active}</p>
            <p className="text-sm text-cyan-300 mt-2">
              {formatPercentage((reportData.customers.active / reportData.customers.total) * 100)} of {reportData.customers.total} total
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{formatPercentage(reportData.tests.passRate)}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Tests Completed</h3>
            <p className="text-3xl font-bold text-white">{reportData.tests.completed}</p>
            <p className="text-sm text-cyan-300 mt-2">
              {reportData.tests.pending} pending, {reportData.tests.overdue} overdue
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{formatPercentage(reportData.efficiency.completionRate)}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Efficiency Score</h3>
            <p className="text-3xl font-bold text-white">{reportData.efficiency.customerSatisfaction}/5.0</p>
            <p className="text-sm text-cyan-300 mt-2">
              {reportData.efficiency.avgResponseTime}d avg response
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend Chart */}
          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Revenue Trend</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                  <span className="text-sm text-white/80">Revenue</span>
                </div>
              </div>
            </div>
            
            {/* Simple Chart Representation */}
            <div className="space-y-3">
              {chartData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className="text-white/80 text-sm w-12">{data.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-cyan-400/20 rounded-full h-2">
                      <div 
                        className="bg-cyan-400 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${(data.revenue / Math.max(...chartData.map(d => d.revenue))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-cyan-400 text-sm font-medium w-16 text-right">
                    {formatCurrency(data.revenue).replace('$', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Test Performance */}
          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Test Performance</h3>
              <div className="text-sm text-green-400 font-medium">
                {formatPercentage(reportData.tests.passRate)} Pass Rate
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-white">Passed</span>
                </div>
                <span className="text-green-400 font-semibold">{Math.round(reportData.tests.completed * reportData.tests.passRate / 100)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  <span className="text-white">Pending</span>
                </div>
                <span className="text-yellow-400 font-semibold">{reportData.tests.pending}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <span className="text-white">Overdue</span>
                </div>
                <span className="text-red-400 font-semibold">{reportData.tests.overdue}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-400/20 rounded-lg">
              <h4 className="text-cyan-300 font-medium mb-2">Performance Insights</h4>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• {formatPercentage(reportData.tests.passRate)} of tests pass on first attempt</li>
                <li>• {reportData.efficiency.avgResponseTime} day average response time</li>
                <li>• {formatPercentage(reportData.customers.retention)} customer retention rate</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Reports Section */}
        <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Detailed Reports</h3>
            <div className="flex space-x-2">
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="overview" className="bg-slate-800">Business Overview</option>
                <option value="revenue" className="bg-slate-800">Revenue Analysis</option>
                <option value="customer" className="bg-slate-800">Customer Report</option>
                <option value="compliance" className="bg-slate-800">Compliance Report</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              href="/tester-portal/reports/revenue"
              className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3">
                <DollarSign className="h-6 w-6 text-green-400" />
                <h4 className="text-white font-medium">Revenue Analysis</h4>
              </div>
              <p className="text-white/80 text-sm mb-2">
                Detailed breakdown of revenue streams, payment trends, and financial forecasting.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-400">View Report</span>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
            </Link>

            <Link 
              href="/tester-portal/reports/customers"
              className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Users className="h-6 w-6 text-blue-400" />
                <h4 className="text-white font-medium">Customer Analytics</h4>
              </div>
              <p className="text-white/80 text-sm mb-2">
                Customer acquisition, retention, and behavior analysis with growth insights.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-400">View Report</span>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </Link>

            <Link 
              href="/tester-portal/reports/compliance"
              className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="h-6 w-6 text-purple-400" />
                <h4 className="text-white font-medium">Compliance Report</h4>
              </div>
              <p className="text-white/80 text-sm mb-2">
                Test completion rates, compliance status, and regulatory reporting.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-400">View Report</span>
                <FileText className="h-4 w-4 text-purple-400" />
              </div>
            </Link>

            <Link 
              href="/tester-portal/reports/efficiency"
              className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Activity className="h-6 w-6 text-yellow-400" />
                <h4 className="text-white font-medium">Operational Efficiency</h4>
              </div>
              <p className="text-white/80 text-sm mb-2">
                Response times, completion rates, and operational performance metrics.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-400">View Report</span>
                <Target className="h-4 w-4 text-yellow-400" />
              </div>
            </Link>

            <Link 
              href="/tester-portal/reports/forecast"
              className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp className="h-6 w-6 text-green-400" />
                <h4 className="text-white font-medium">Business Forecast</h4>
              </div>
              <p className="text-white/80 text-sm mb-2">
                Predictive analytics for revenue, customer growth, and business planning.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-400">View Report</span>
                <BarChart3 className="h-4 w-4 text-green-400" />
              </div>
            </Link>

            <Link 
              href="/tester-portal/reports/custom"
              className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3">
                <PieChart className="h-6 w-6 text-cyan-400" />
                <h4 className="text-white font-medium">Custom Reports</h4>
              </div>
              <p className="text-white/80 text-sm mb-2">
                Build custom reports with specific date ranges, filters, and metrics.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-400">Create Report</span>
                <FileText className="h-4 w-4 text-cyan-400" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}