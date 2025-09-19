'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  Phone,
  Globe,
  Filter,
  Download,
  ArrowLeft,
  Target,
  PieChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    forecast: number;
    breakdown: {
      services: number;
      devices: number;
      consulting: number;
      maintenance: number;
    };
  };
  customers: {
    total: number;
    newThisMonth: number;
    churnRate: number;
    lifetimeValue: number;
    segments: {
      enterprise: number;
      business: number;
      residential: number;
    };
  };
  performance: {
    testsCompleted: number;
    efficiency: number;
    avgResponseTime: number;
    customerSatisfaction: number;
  };
  geography: Array<{
    name: string;
    revenue: number;
    customers: number;
    growth: number;
  }>;
  channels: {
    web: number;
    mobile: number;
    phone: number;
    referral: number;
  };
  trends: Array<{
    month: string;
    revenue: number;
    customers: number;
    tests: number;
  }>;
}

export default function BusinessAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Mock data - this will be replaced with actual API call
        const mockData: AnalyticsData = {
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
            lifetimeValue: 12500,
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
        };

        setAnalyticsData(mockData);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedTimeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount > 999999 ? 'compact' : 'standard'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-white/80">Failed to load analytics data</p>
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
            <div className="flex items-center space-x-4">
              <Link href="/business">
                <Button variant="outline" className="border-blue-400 text-white/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <BarChart3 className="h-6 w-6 mr-3 text-blue-400" />
                  Business Analytics
                </h1>
                <p className="text-white/60">Enterprise-level business intelligence and insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>

              <div className="flex rounded-xl bg-black/50 border border-white/20">
                {['overview', 'revenue', 'customers', 'performance'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setSelectedView(view)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      view === 'overview' ? 'rounded-l-xl' : view === 'performance' ? 'rounded-r-xl' : ''
                    } ${
                      selectedView === view
                        ? 'bg-blue-600 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>

              <Button variant="outline" className="border-blue-400 text-white/80">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(analyticsData.revenue.total)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />
                  <span className="text-emerald-400 text-sm font-medium">
                    {formatPercentage(analyticsData.revenue.growth)}
                  </span>
                </div>
              </div>
              <DollarSign className="h-12 w-12 text-emerald-400" />
            </div>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-white">{analyticsData.customers.total.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />
                  <span className="text-emerald-400 text-sm font-medium">
                    +{analyticsData.customers.newThisMonth} this month
                  </span>
                </div>
              </div>
              <Users className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm font-medium">Tests Completed</p>
                <p className="text-3xl font-bold text-white">{analyticsData.performance.testsCompleted.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-amber-400 mr-1" />
                  <span className="text-amber-400 text-sm font-medium">
                    {analyticsData.performance.avgResponseTime}h avg response
                  </span>
                </div>
              </div>
              <Activity className="h-12 w-12 text-purple-400" />
            </div>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm font-medium">Customer Satisfaction</p>
                <p className="text-3xl font-bold text-white">{analyticsData.performance.customerSatisfaction}/5.0</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />
                  <span className="text-emerald-400 text-sm font-medium">
                    {analyticsData.performance.efficiency}% efficiency
                  </span>
                </div>
              </div>
              <Target className="h-12 w-12 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Breakdown */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-emerald-400" />
              Revenue Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(analyticsData.revenue.breakdown).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-white/80 capitalize">{category}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-white/20 rounded-full mr-3">
                      <div
                        className="h-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full"
                        style={{ width: `${(amount / analyticsData.revenue.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{formatCurrency(amount)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/60 text-sm mb-1">Revenue Forecast</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analyticsData.revenue.forecast)}</p>
              <p className="text-emerald-400 text-sm">Projected annual revenue</p>
            </div>
          </div>

          {/* Customer Segments */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-blue-400" />
              Customer Segments
            </h3>
            <div className="space-y-4">
              {Object.entries(analyticsData.customers.segments).map(([segment, count]) => (
                <div key={segment} className="flex items-center justify-between">
                  <span className="text-white/80 capitalize">{segment}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-white/20 rounded-full mr-3">
                      <div
                        className="h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                        style={{ width: `${(count / analyticsData.customers.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm mb-1">Customer LTV</p>
                <p className="text-xl font-bold text-white">{formatCurrency(analyticsData.customers.lifetimeValue)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm mb-1">Churn Rate</p>
                <p className="text-xl font-bold text-white">{analyticsData.customers.churnRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Geographic Performance */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-400" />
              Geographic Performance
            </h3>
            <div className="space-y-4">
              {analyticsData.geography.map((region) => (
                <div key={region.name} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{region.name}</h4>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />
                      <span className="text-emerald-400 text-sm">{formatPercentage(region.growth)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Revenue</p>
                      <p className="text-white font-medium">{formatCurrency(region.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Customers</p>
                      <p className="text-white font-medium">{region.customers.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Performance */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-amber-400" />
              Channel Performance
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Web Portal', value: analyticsData.channels.web, icon: Monitor },
                { name: 'Mobile App', value: analyticsData.channels.mobile, icon: Smartphone },
                { name: 'Phone Calls', value: analyticsData.channels.phone, icon: Phone },
                { name: 'Referrals', value: analyticsData.channels.referral, icon: Globe }
              ].map((channel) => (
                <div key={channel.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <channel.icon className="h-5 w-5 text-blue-400 mr-3" />
                    <span className="text-white/80">{channel.name}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 h-2 bg-white/20 rounded-full mr-3">
                      <div
                        className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
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
              <p className="text-white/80 text-sm">Mobile engagement is increasing by 15% monthly. Consider mobile-first campaign strategies.</p>
            </div>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-400" />
            Performance Trends
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {analyticsData.trends.map((month) => (
              <div key={month.month} className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm font-medium mb-2">{month.month}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-white/60">Revenue</p>
                    <p className="text-white font-semibold">{formatCurrency(month.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Customers</p>
                    <p className="text-white font-semibold">{month.customers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Tests</p>
                    <p className="text-white font-semibold">{month.tests.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}