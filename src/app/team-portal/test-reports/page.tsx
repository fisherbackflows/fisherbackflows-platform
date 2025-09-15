'use client';

import { useState, useEffect } from 'react';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface TestReport {
  id: string;
  reportNumber: string;
  customerName: string;
  deviceType: string;
  testDate: string;
  status: 'passed' | 'failed' | 'pending';
  technicianName: string;
  location: string;
  nextTestDue: string;
}

export default function TestReportsPage() {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/team/test-reports');
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    const matchesDate = !dateFilter || report.testDate.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-400 bg-green-500/10 border-green-400/50';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-400/50';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/50';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="glass border border-blue-400 rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white/80">Loading test reports...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Test Reports</h1>
            <p className="text-white/80">
              Manage and review backflow prevention test reports
            </p>
          </div>

          <Button className="glass-btn-primary hover:glow-blue">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {/* Filters */}
        <div className="glass border border-blue-400 rounded-2xl p-6 mb-6 glow-blue-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-blue-400/50 glass text-white placeholder-white/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-blue-400/50 glass text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50"
              >
                <option value="all" className="bg-slate-900">All Status</option>
                <option value="passed" className="bg-slate-900">Passed</option>
                <option value="failed" className="bg-slate-900">Failed</option>
                <option value="pending" className="bg-slate-900">Pending</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-blue-400/50 glass text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50"
              />
            </div>

            {/* Export */}
            <Button className="glass hover:glass text-white/80 border border-blue-400/50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-green-400/50 rounded-2xl p-6 bg-green-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Passed Tests</p>
                <p className="text-2xl font-bold text-white">
                  {reports.filter(r => r.status === 'passed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="glass border border-red-400/50 rounded-2xl p-6 bg-red-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-medium">Failed Tests</p>
                <p className="text-2xl font-bold text-white">
                  {reports.filter(r => r.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="glass border border-yellow-400/50 rounded-2xl p-6 bg-yellow-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="glass border border-blue-400/50 rounded-2xl p-6 bg-blue-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Total Reports</p>
                <p className="text-2xl font-bold text-white">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="glass border border-blue-400 rounded-2xl overflow-hidden glow-blue-sm">
          <div className="p-6 border-b border-blue-400/30">
            <h2 className="text-xl font-semibold text-white">
              Test Reports ({filteredReports.length})
            </h2>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Reports Found</h3>
              <p className="text-white/60">
                {searchTerm || statusFilter !== 'all' || dateFilter
                  ? 'No reports match your current filters.'
                  : 'No test reports have been created yet.'}
              </p>
              {(!searchTerm && statusFilter === 'all' && !dateFilter) && (
                <Button className="mt-4 glass-btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Report
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white/80 font-medium">Report #</th>
                    <th className="text-left p-4 text-white/80 font-medium">Customer</th>
                    <th className="text-left p-4 text-white/80 font-medium">Device</th>
                    <th className="text-left p-4 text-white/80 font-medium">Test Date</th>
                    <th className="text-left p-4 text-white/80 font-medium">Status</th>
                    <th className="text-left p-4 text-white/80 font-medium">Technician</th>
                    <th className="text-left p-4 text-white/80 font-medium">Next Due</th>
                    <th className="text-left p-4 text-white/80 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-t border-blue-400/20 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="text-blue-300 font-medium">{report.reportNumber}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-white font-medium">{report.customerName}</div>
                          <div className="text-white/60 text-sm">{report.location}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white">{report.deviceType}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-white">
                          {new Date(report.testDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="capitalize">{report.status}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white">{report.technicianName}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-white">
                          {new Date(report.nextTestDue).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="glass hover:glass text-white/80 border border-blue-400/50"
                            aria-label={`View report ${report.reportNumber}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="glass hover:glass text-white/80 border border-blue-400/50"
                            aria-label={`Download report ${report.reportNumber}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}