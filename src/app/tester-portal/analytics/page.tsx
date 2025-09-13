'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  FunnelIcon,
  MapPinIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  revenue: {
    total: number
    growth: number
    forecast: number
    breakdown: {
      services: number
      devices: number
      consulting: number
      maintenance: number
    }
  }
  customers: {
    total: number
    newThisMonth: number
    churnRate: number
    lifetime_value: number
    segments: {
      enterprise: number
      business: number
      residential: number
    }
  }
  performance: {
    testsCompleted: number
    efficiency: number
    avgResponseTime: number
    customerSatisfaction: number
  }
  geography: {
    regions: Array<{
      name: string
      revenue: number
      customers: number
      growth: number
    }>
  }
  channels: {
    web: number
    mobile: number
    phone: number
    referral: number
  }
  trends: {
    monthly: Array<{
      month: string
      revenue: number
      customers: number
      tests: number
    }>
  }
}

const mockAnalyticsData: AnalyticsData = {
  revenue: {
    total: 847500,
    growth: 23.5,
    forecast: 1200000,
    breakdown: {
      services: 425000,
      devices: 298000,
      consulting: 89500,
      maintenance: 35000
    }
  },
  customers: {
    total: 2847,
    newThisMonth: 184,
    churnRate: 3.2,
    lifetime_value: 12500,
    segments: {
      enterprise: 127,
      business: 834,
      residential: 1886
    }
  },
  performance: {
    testsCompleted: 15842,
    efficiency: 94.2,
    avgResponseTime: 2.4,
    customerSatisfaction: 4.7
  },
  geography: [
    { name: 'North District', revenue: 298500, customers: 892, growth: 18.3 },
    { name: 'South District', revenue: 234000, customers: 701, growth: 12.7 },
    { name: 'East District', revenue: 189000, customers: 634, growth: 28.1 },
    { name: 'West District', revenue: 126000, customers: 420, growth: 15.9 }
  ],
  channels: {
    web: 45,
    mobile: 32,
    phone: 18,
    referral: 5
  },
  trends: [
    { month: 'Jul', revenue: 68000, customers: 234, tests: 1284 },
    { month: 'Aug', revenue: 72500, customers: 267, tests: 1456 },
    { month: 'Sep', revenue: 79200, customers: 289, tests: 1623 },
    { month: 'Oct', revenue: 84700, customers: 312, tests: 1789 },
    { month: 'Nov', revenue: 91300, customers: 345, tests: 1945 },
    { month: 'Dec', revenue: 98400, customers: 378, tests: 2134 }
  ]
}

export default function AdvancedAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months')
  const [selectedView, setSelectedView] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount > 999999 ? 'compact' : 'standard'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/tester-portal/dashboard/crm"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <ChartBarIcon className="h-8 w-8 mr-3 text-blue-400" />
                Advanced Analytics
              </h1>
              <p className="text-blue-200 mt-1">Enterprise-level business intelligence and insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1month" className="bg-slate-800">Last Month</option>
              <option value="3months" className="bg-slate-800">Last 3 Months</option>
              <option value="6months" className="bg-slate-800">Last 6 Months</option>
              <option value="1year" className="bg-slate-800">Last Year</option>
            </select>
            
            <div className="flex rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
              <button
                onClick={() => setSelectedView('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  selectedView === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedView('revenue')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedView === 'revenue'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSelectedView('customers')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedView === 'customers'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => setSelectedView('performance')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  selectedView === 'performance'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Performance
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(mockAnalyticsData.revenue.total)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm font-medium">
                    {formatPercentage(mockAnalyticsData.revenue.growth)}
                  </span>
                </div>
              </div>
              <CurrencyDollarIcon className="h-12 w-12 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-white">{mockAnalyticsData.customers.total.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm font-medium">
                    +{mockAnalyticsData.customers.newThisMonth} this month
                  </span>
                </div>
              </div>
              <UsersIcon className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Tests Completed</p>
                <p className="text-3xl font-bold text-white">{mockAnalyticsData.performance.testsCompleted.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <ClockIcon className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-yellow-400 text-sm font-medium">
                    {mockAnalyticsData.performance.avgResponseTime}h avg response
                  </span>
                </div>
              </div>
              <PresentationChartLineIcon className="h-12 w-12 text-purple-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Customer Satisfaction</p>
                <p className="text-3xl font-bold text-white">{mockAnalyticsData.performance.customerSatisfaction}/5.0</p>
                <div className="flex items-center mt-2">
                  <TrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm font-medium">
                    {mockAnalyticsData.performance.efficiency}% efficiency
                  </span>
                </div>
              </div>
              <ChartBarIcon className="h-12 w-12 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Breakdown */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-400" />
              Revenue Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(mockAnalyticsData.revenue.breakdown).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-blue-200 capitalize">{category}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-white/20 rounded-full mr-3">
                      <div 
                        className="h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                        style={{ width: `${(amount / mockAnalyticsData.revenue.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{formatCurrency(amount)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-blue-200 text-sm mb-1">Revenue Forecast</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(mockAnalyticsData.revenue.forecast)}</p>
              <p className="text-green-400 text-sm">Projected annual revenue</p>
            </div>
          </div>

          {/* Customer Segments */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <UsersIcon className="h-6 w-6 mr-2 text-blue-400" />
              Customer Segments
            </h3>
            <div className="space-y-4">
              {Object.entries(mockAnalyticsData.customers.segments).map(([segment, count]) => (
                <div key={segment} className="flex items-center justify-between">
                  <span className="text-blue-200 capitalize">{segment}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-white/20 rounded-full mr-3">
                      <div 
                        className="h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                        style={{ width: `${(count / mockAnalyticsData.customers.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-blue-200 text-sm mb-1">Customer LTV</p>
                <p className="text-xl font-bold text-white">{formatCurrency(mockAnalyticsData.customers.lifetime_value)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-blue-200 text-sm mb-1">Churn Rate</p>
                <p className="text-xl font-bold text-white">{mockAnalyticsData.customers.churnRate}%</p>
              </div>
            </div>
          </div>

          {/* Geographic Performance */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <MapPinIcon className="h-6 w-6 mr-2 text-orange-400" />
              Geographic Performance
            </h3>
            <div className="space-y-4">
              {mockAnalyticsData.geography.regions.map((region) => (
                <div key={region.name} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{region.name}</h4>
                    <div className="flex items-center">
                      <TrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                      <span className="text-green-400 text-sm">{formatPercentage(region.growth)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-200">Revenue</p>
                      <p className="text-white font-medium">{formatCurrency(region.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Customers</p>
                      <p className="text-white font-medium">{region.customers.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Performance */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FunnelIcon className="h-6 w-6 mr-2 text-yellow-400" />
              Channel Performance
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Web Portal', value: mockAnalyticsData.channels.web, icon: ComputerDesktopIcon },
                { name: 'Mobile App', value: mockAnalyticsData.channels.mobile, icon: DevicePhoneMobileIcon },
                { name: 'Phone Calls', value: mockAnalyticsData.channels.phone, icon: CalendarIcon },
                { name: 'Referrals', value: mockAnalyticsData.channels.referral, icon: GlobeAltIcon }
              ].map((channel) => (
                <div key={channel.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <channel.icon className="h-5 w-5 text-blue-400 mr-3" />
                    <span className="text-blue-200">{channel.name}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 h-2 bg-white/20 rounded-full mr-3">
                      <div 
                        className="h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        style={{ width: `${channel.value}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">{channel.value}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
              <p className="text-white font-medium mb-2">Acquisition Insights</p>
              <p className="text-blue-200 text-sm">Mobile engagement is increasing by 15% monthly. Consider mobile-first campaign strategies.</p>
            </div>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <PresentationChartLineIcon className="h-6 w-6 mr-2 text-purple-400" />
            Performance Trends
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {mockAnalyticsData.trends.map((month) => (
              <div key={month.month} className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-blue-200 text-sm font-medium mb-2">{month.month}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-blue-300">Revenue</p>
                    <p className="text-white font-semibold">{formatCurrency(month.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300">Customers</p>
                    <p className="text-white font-semibold">{month.customers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300">Tests</p>
                    <p className="text-white font-semibold">{month.tests.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}