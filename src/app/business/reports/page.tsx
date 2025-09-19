'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Building,
  User,
  Calendar,
  Shield,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';

interface TestReport {
  id: string;
  reportNumber: string;
  customerName: string;
  customerId: string;
  testDate: string;
  deviceType: string;
  deviceLocation: string;
  serialNumber: string;
  testResult: 'passed' | 'failed' | 'conditional';
  testerName: string;
  testerCertification: string;
  submittedToDistrict: boolean;
  districtName?: string;
  submissionDate?: string;
  nextTestDue: string;
  status: 'draft' | 'completed' | 'submitted' | 'approved';
  pdfUrl?: string;
}

export default function TestReportsManagement() {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResult, setFilterResult] = useState('all');

  useEffect(() => {
    // Load test reports - this will be replaced with actual API call
    const loadReports = async () => {
      try {
        // Mock data for now
        const mockReports: TestReport[] = [
          {
            id: '1',
            reportNumber: 'RPT-2024-001',
            customerName: 'John Smith',
            customerId: '1',
            testDate: '2024-01-15',
            deviceType: 'Reduced Pressure Backflow Assembly',
            deviceLocation: 'Main Water Line',
            serialNumber: 'RP-2023-001',
            testResult: 'passed',
            testerName: 'Mike Johnson',
            testerCertification: 'WAT-12345',
            submittedToDistrict: true,
            districtName: 'Tacoma Water',
            submissionDate: '2024-01-16',
            nextTestDue: '2025-01-15',
            status: 'submitted',
            pdfUrl: '/reports/RPT-2024-001.pdf'
          },
          {
            id: '2',
            reportNumber: 'RPT-2024-002',
            customerName: 'Sarah Wilson',
            customerId: '2',
            testDate: '2024-01-20',
            deviceType: 'Double Check Valve Assembly',
            deviceLocation: 'Irrigation System',
            serialNumber: 'DC-2023-002',
            testResult: 'failed',
            testerName: 'Lisa Rodriguez',
            testerCertification: 'WAT-12346',
            submittedToDistrict: false,
            nextTestDue: '2024-02-20',
            status: 'completed'
          },
          {
            id: '3',
            reportNumber: 'RPT-2024-003',
            customerName: 'David Chen',
            customerId: '3',
            testDate: '2024-01-25',
            deviceType: 'Pressure Vacuum Breaker',
            deviceLocation: 'Fire Sprinkler System',
            serialNumber: 'PVB-2023-003',
            testResult: 'passed',
            testerName: 'Mike Johnson',
            testerCertification: 'WAT-12345',
            submittedToDistrict: true,
            districtName: 'Seattle Public Utilities',
            submissionDate: '2024-01-26',
            nextTestDue: '2025-01-25',
            status: 'approved',
            pdfUrl: '/reports/RPT-2024-003.pdf'
          },
          {
            id: '4',
            reportNumber: 'RPT-2024-004',
            customerName: 'Maria Garcia',
            customerId: '4',
            testDate: '2024-02-01',
            deviceType: 'Reduced Pressure Backflow Assembly',
            deviceLocation: 'Commercial Kitchen',
            serialNumber: 'RP-2023-004',
            testResult: 'conditional',
            testerName: 'Lisa Rodriguez',
            testerCertification: 'WAT-12346',
            submittedToDistrict: false,
            nextTestDue: '2024-03-01',
            status: 'draft'
          }
        ];

        setReports(mockReports);
      } catch (error) {
        console.error('Failed to load reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesResult = filterResult === 'all' || report.testResult === filterResult;

    return matchesSearch && matchesStatus && matchesResult;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
      case 'submitted': return 'border-blue-400 bg-blue-500/20 text-blue-200';
      case 'completed': return 'border-amber-400 bg-amber-500/20 text-amber-200';
      case 'draft': return 'border-gray-400 bg-gray-500/20 text-gray-200';
      default: return 'border-blue-400 bg-blue-500/20 text-blue-200';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'passed': return 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
      case 'failed': return 'border-red-400 bg-red-500/20 text-red-200';
      case 'conditional': return 'border-amber-400 bg-amber-500/20 text-amber-200';
      default: return 'border-gray-400 bg-gray-500/20 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'submitted': return <Send className="h-4 w-4" />;
      case 'completed': return <FileText className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const totalReports = reports.length;
  const passedReports = reports.filter(r => r.testResult === 'passed').length;
  const failedReports = reports.filter(r => r.testResult === 'failed').length;
  const submittedReports = reports.filter(r => r.submittedToDistrict).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading test reports...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-white">Test Reports</h1>
              <p className="text-white/60">Manage compliance reports and district submissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/business">
                <Button variant="outline" className="border-blue-400 text-white/80">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Link href="/business/reports/new">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* Report Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-blue-400 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Reports</p>
                <p className="text-2xl font-bold text-white">{totalReports}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-300" />
            </div>
          </div>

          <div className="glass border border-emerald-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Passed Tests</p>
                <p className="text-2xl font-bold text-white">{passedReports}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-300" />
            </div>
          </div>

          <div className="glass border border-red-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Failed Tests</p>
                <p className="text-2xl font-bold text-white">{failedReports}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-300" />
            </div>
          </div>

          <div className="glass border border-purple-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Submitted to District</p>
                <p className="text-2xl font-bold text-white">{submittedReports}</p>
              </div>
              <Building className="h-8 w-8 text-purple-300" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                placeholder="Search by report number, customer, or serial number..."
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            {/* Result Filter */}
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="pl-10 pr-8 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All Results</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="conditional">Conditional</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button variant="outline" className="border-blue-400 text-white/80">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="glass border border-blue-400 rounded-xl glow-blue-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Report</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Customer</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Device</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Test Date</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Result</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Status</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">District</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">

                    {/* Report Number */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{report.reportNumber}</p>
                        <p className="text-white/60 text-sm">
                          Next due: {new Date(report.nextTestDue).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-white/80">{report.customerName}</span>
                      </div>
                    </td>

                    {/* Device */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white/80 text-sm">{report.deviceType}</p>
                        <p className="text-white/60 text-xs">{report.deviceLocation}</p>
                        <p className="text-white/60 text-xs">S/N: {report.serialNumber}</p>
                      </div>
                    </td>

                    {/* Test Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-white/60" />
                        <div>
                          <p className="text-white/80 text-sm">
                            {new Date(report.testDate).toLocaleDateString()}
                          </p>
                          <p className="text-white/60 text-xs">by {report.testerName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Test Result */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getResultColor(report.testResult)}`}>
                        {report.testResult.toUpperCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 w-fit ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span>{report.status.toUpperCase()}</span>
                      </span>
                    </td>

                    {/* District Submission */}
                    <td className="px-6 py-4">
                      {report.submittedToDistrict ? (
                        <div>
                          <p className="text-emerald-200 text-sm flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </p>
                          <p className="text-white/60 text-xs">{report.districtName}</p>
                          <p className="text-white/60 text-xs">
                            {report.submissionDate ? new Date(report.submissionDate).toLocaleDateString() : ''}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-amber-200 text-sm flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </p>
                          {report.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1 border-blue-400 text-blue-200 text-xs"
                            >
                              Submit
                            </Button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link href={`/business/reports/${report.id}`}>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        {report.pdfUrl && (
                          <Button variant="outline" size="sm" className="border-emerald-400 text-emerald-200">
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <Link href={`/business/reports/${report.id}/edit`}>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No test reports found matching your criteria</p>
              <Link href="/business/reports/new" className="mt-4 inline-block">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Report
                </Button>
              </Link>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}