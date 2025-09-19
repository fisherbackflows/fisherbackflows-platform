'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  FileText, 
  Shield,
  Download,
  RefreshCw,
  Filter,
  DateRange,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

interface DashboardMetrics {
  overview: {
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    completedTests: number;
    pendingTests: number;
    overdueInvoices: number;
    complianceRate: number;
  };
  trends: {
    customerGrowth: Array<{ month: string; customers: number; revenue: number }>;
    testCompletion: Array<{ month: string; completed: number; scheduled: number; compliance: number }>;
    revenueBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  };
  performance: {
    testsByType: Array<{ type: string; count: number; compliance: number }>;
    technicianPerformance: Array<{ name: string; tests: number; compliance: number; rating: number }>;
    geographicDistribution: Array<{ region: string; customers: number; revenue: number }>;
  };
  compliance: {
    complianceScore: number;
    criticalIssues: number;
    resolvedIssues: number;
    auditEvents: Array<{ date: string; events: number; severity: string }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminReportingDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadDashboardData();
  }, [timeframe, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports/dashboard?timeframe=${timeframe}&start=${dateRange.start}&end=${dateRange.end}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'xlsx' | 'csv') => {
    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          reportType: selectedReport,
          timeframe,
          dateRange
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-report-${selectedReport}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
          <span className="text-white text-xl">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    format = 'number' 
  }: {
    title: string;
    value: number;
    change?: number;
    icon: React.ComponentType<{ className?: string }>;
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const colorClasses = {
      blue: 'text-blue-400 bg-blue-700/20',
      green: 'text-green-400 bg-green-700/20',
      orange: 'text-orange-400 bg-orange-500/20',
      red: 'text-red-400 bg-red-500/20',
      purple: 'text-purple-400 bg-purple-500/20'
    };

    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return `$${val.toLocaleString()}`;
        case 'percentage': return `${val.toFixed(1)}%`;
        default: return val.toLocaleString();
      }
    };

    return (
      <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${
              change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <TrendingUp className={`h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-white/80 text-sm font-medium mb-2">{title}</h3>
        <p className="text-3xl font-bold text-white">{formatValue(value)}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <BarChart className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Reports</h1>
                <p className="text-gray-800">Business intelligence and analytics dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timeframe Selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="custom">Custom range</option>
              </select>

              {/* Export Button */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => exportReport('pdf')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 rounded-t-lg transition-colors"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => exportReport('xlsx')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => exportReport('csv')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 rounded-b-lg transition-colors"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>

              <button
                onClick={loadDashboardData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Report Type Selector */}
          <div className="flex gap-2 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'financial', label: 'Financial', icon: DollarSign },
              { id: 'operations', label: 'Operations', icon: Calendar },
              { id: 'compliance', label: 'Compliance', icon: Shield },
              { id: 'performance', label: 'Performance', icon: Target }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedReport(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  selectedReport === id
                    ? 'border-blue-500 bg-blue-700/20 text-blue-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Customers"
            value={metrics.overview.totalCustomers}
            change={12.5}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Monthly Revenue"
            value={metrics.overview.monthlyRevenue}
            change={8.3}
            icon={DollarSign}
            color="green"
            format="currency"
          />
          <MetricCard
            title="Tests Completed"
            value={metrics.overview.completedTests}
            change={-2.1}
            icon={CheckCircle}
            color="purple"
          />
          <MetricCard
            title="Compliance Rate"
            value={metrics.overview.complianceRate}
            change={5.7}
            icon={Shield}
            color="green"
            format="percentage"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Customer Growth Chart */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Customer Growth & Revenue
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.trends.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="customers" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="2"
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Test Completion Trends */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-400" />
              Test Completion Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trends.testCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scheduled" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="compliance" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Breakdown & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Breakdown */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              Revenue Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.trends.revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="amount"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {metrics.trends.revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Technician Performance */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-400" />
              Technician Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.performance.technicianPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="tests" fill="#3B82F6" />
                <Bar dataKey="compliance" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              Compliance Overview
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  metrics.compliance.complianceScore >= 90 ? 'text-green-400' :
                  metrics.compliance.complianceScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {metrics.compliance.complianceScore}%
                </div>
                <div className="text-xs text-gray-800">Compliance Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {metrics.compliance.criticalIssues}
                </div>
                <div className="text-xs text-gray-800">Critical Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {metrics.compliance.resolvedIssues}
                </div>
                <div className="text-xs text-gray-800">Resolved</div>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics.compliance.auditEvents}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/admin/audit-logs'}
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg transition-colors"
            >
              <Shield className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <div className="text-white font-medium">View Audit Logs</div>
                <div className="text-gray-800 text-sm">Security & compliance</div>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/admin/data-management'}
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <div className="text-white font-medium">Export Data</div>
                <div className="text-gray-800 text-sm">Backup & reports</div>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/admin/search'}
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg transition-colors"
            >
              <Activity className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <div className="text-white font-medium">Search Platform</div>
                <div className="text-gray-800 text-sm">Find anything</div>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/admin/analytics'}
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <div className="text-left">
                <div className="text-white font-medium">Analytics</div>
                <div className="text-gray-800 text-sm">Detailed insights</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}