'use client';

import { useState, useEffect } from 'react';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  Upload,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  Users,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface DistrictReport {
  id: string;
  reportNumber: string;
  waterDistrict: string;
  districtEmail: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  testDate: string;
  submissionDate?: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'rejected' | 'expired';
  deviceType: string;
  deviceSerial: string;
  testResult: 'passed' | 'failed';
  technicianName: string;
  certificateNumber: string;
  notes: string;
  retryCount: number;
  lastError?: string;
}

const waterDistricts = [
  {
    name: 'Tacoma Water',
    email: 'backflow@tacomawater.gov',
    submitMethod: 'email',
    requirements: ['Test Certificate', 'Device Photo'],
    turnaround: '2-3 business days'
  },
  {
    name: 'Lakewood Water District',
    email: 'testing@lakewoodwater.com',
    submitMethod: 'portal',
    requirements: ['Test Certificate', 'Technician License'],
    turnaround: '1-2 business days'
  },
  {
    name: 'Puyallup Water',
    email: 'backflow@puyallupwater.org',
    submitMethod: 'email',
    requirements: ['Test Certificate', 'Customer Signature'],
    turnaround: '3-5 business days'
  },
  {
    name: 'Gig Harbor Water',
    email: 'compliance@gigharborwater.com',
    submitMethod: 'email',
    requirements: ['Test Certificate'],
    turnaround: '1-3 business days'
  },
  {
    name: 'Pierce County Water Utility',
    email: 'backflow@piercecountywa.org',
    submitMethod: 'portal',
    requirements: ['Test Certificate', 'Device Photo', 'Location Map'],
    turnaround: '3-7 business days'
  }
];

const statusConfig = {
  pending: { label: 'Pending Submission', color: 'bg-yellow-400/20 text-yellow-400', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm text-blue-300', icon: Send },
  confirmed: { label: 'Confirmed', color: 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm text-green-300', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm text-red-300', icon: AlertTriangle },
  expired: { label: 'Expired', color: 'glass text-white/90', icon: AlertTriangle }
};

export default function DistrictReportsPage() {
  const [reports, setReports] = useState<DistrictReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    // Load sample district reports
    const today = new Date();
    const sampleReports: DistrictReport[] = [
      {
        id: '1',
        reportNumber: 'TR-2024-001',
        waterDistrict: 'Tacoma Water',
        districtEmail: 'backflow@tacomawater.gov',
        customerId: '1',
        customerName: 'Johnson Properties LLC',
        customerAddress: '1234 Pacific Ave, Tacoma, WA 98402',
        testDate: '2024-08-15',
        submissionDate: '2024-08-16',
        status: 'confirmed',
        deviceType: 'RP',
        deviceSerial: 'RP-12345',
        testResult: 'passed',
        technicianName: 'John Fisher',
        certificateNumber: 'BAT-WA-12345',
        notes: 'All devices tested successfully. Next test due August 2025.',
        retryCount: 0
      },
      {
        id: '2',
        reportNumber: 'TR-2024-002',
        waterDistrict: 'Lakewood Water District',
        districtEmail: 'testing@lakewoodwater.com',
        customerId: '2',
        customerName: 'Smith Residence',
        customerAddress: '5678 6th Ave, Tacoma, WA 98406',
        testDate: '2024-08-18',
        submissionDate: '2024-08-19',
        status: 'submitted',
        deviceType: 'PVB',
        deviceSerial: 'PVB-67890',
        testResult: 'passed',
        technicianName: 'John Fisher',
        certificateNumber: 'BAT-WA-12345',
        notes: 'Device passed all tests. Certificate mailed to customer.',
        retryCount: 0
      },
      {
        id: '3',
        reportNumber: 'TR-2024-003',
        waterDistrict: 'Puyallup Water',
        districtEmail: 'backflow@puyallupwater.org',
        customerId: '3',
        customerName: 'Parkland Medical Center',
        customerAddress: '910 112th St E, Parkland, WA 98444',
        testDate: '2024-08-20',
        status: 'pending',
        deviceType: 'RP',
        deviceSerial: 'RP-11111',
        testResult: 'failed',
        technicianName: 'John Fisher',
        certificateNumber: 'BAT-WA-12345',
        notes: 'Device failed initial test. Repairs completed and retested - now passing.',
        retryCount: 0
      },
      {
        id: '4',
        reportNumber: 'TR-2024-004',
        waterDistrict: 'Gig Harbor Water',
        districtEmail: 'compliance@gigharborwater.com',
        customerId: '4',
        customerName: 'Harbor View Apartments',
        customerAddress: '2500 Harborview Dr, Gig Harbor, WA 98335',
        testDate: '2024-08-22',
        status: 'pending',
        deviceType: 'DC',
        deviceSerial: 'DC-22222',
        testResult: 'passed',
        technicianName: 'John Fisher',
        certificateNumber: 'BAT-WA-12345',
        notes: 'Large apartment complex - multiple devices tested.',
        retryCount: 0
      },
      {
        id: '5',
        reportNumber: 'TR-2024-005',
        waterDistrict: 'Tacoma Water',
        districtEmail: 'backflow@tacomawater.gov',
        customerId: '5',
        customerName: 'Downtown Deli',
        customerAddress: '789 Commerce St, Tacoma, WA 98402',
        testDate: '2024-08-10',
        submissionDate: '2024-08-12',
        status: 'rejected',
        deviceType: 'DC',
        deviceSerial: 'DC-33333',
        testResult: 'passed',
        technicianName: 'John Fisher',
        certificateNumber: 'BAT-WA-12345',
        notes: 'Missing technician signature on form.',
        retryCount: 1,
        lastError: 'Document rejected: Missing technician signature'
      }
    ];

    setTimeout(() => {
      setReports(sampleReports);
      setLoading(false);
    }, 500);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesDistrict = districtFilter === 'all' || report.waterDistrict === districtFilter;
    return matchesStatus && matchesDistrict;
  });

  const getStatusCounts = () => {
    return {
      all: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      submitted: reports.filter(r => r.status === 'submitted').length,
      confirmed: reports.filter(r => r.status === 'confirmed').length,
      rejected: reports.filter(r => r.status === 'rejected').length
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleSubmitReport = async (reportId: string) => {
    setSubmitting(reportId);
    
    try {
      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: 'submitted', 
              submissionDate: new Date().toISOString().split('T')[0]
            }
          : report
      ));
      
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleBulkSubmit = async () => {
    const pendingReports = reports.filter(r => r.status === 'pending');
    
    if (pendingReports.length === 0) {
      alert('No pending reports to submit.');
      return;
    }

    setSubmitting('bulk');
    
    try {
      // Simulate bulk submission
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setReports(prev => prev.map(report => 
        report.status === 'pending'
          ? { 
              ...report, 
              status: 'submitted', 
              submissionDate: new Date().toISOString().split('T')[0]
            }
          : report
      ));
      
      alert(`${pendingReports.length} reports submitted successfully!`);
    } catch (error) {
      console.error('Error submitting reports:', error);
      alert('Error submitting reports. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Navigation Bar */}
      <div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/team-portal/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white" onClick={() => window.history.back()}>
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white/80">Loading district reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">District Reports</h1>
            <p className="text-white/60">Manage and submit reports to water districts</p>
          </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkSubmit}
                disabled={submitting === 'bulk' || statusCounts.pending === 0}
              >
                {submitting === 'bulk' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit All ({statusCounts.pending})
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-yellow-50 rounded-2xl p-3 text-center">
              <div className="text-lg font-bold text-yellow-700">{statusCounts.pending}</div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3 text-center">
              <div className="text-lg font-bold text-blue-700">{statusCounts.submitted}</div>
              <div className="text-xs text-blue-300">Submitted</div>
            </div>
            <div className="bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl rounded-2xl p-3 text-center">
              <div className="text-lg font-bold text-green-700">{statusCounts.confirmed}</div>
              <div className="text-xs text-green-300">Confirmed</div>
            </div>
            <div className="bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl rounded-2xl p-3 text-center">
              <div className="text-lg font-bold text-red-700">{statusCounts.rejected}</div>
              <div className="text-xs text-red-300">Rejected</div>
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="glass rounded-2xl glow-blue-sm p-4 mb-4">
          <div className="flex flex-col space-y-3">
            {/* Status Filters */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
              <div className="flex space-x-2 overflow-x-auto">
                {[
                  { key: 'pending', label: 'Pending', count: statusCounts.pending },
                  { key: 'submitted', label: 'Submitted', count: statusCounts.submitted },
                  { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
                  { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
                  { key: 'all', label: 'All', count: statusCounts.all }
                ].map(filter => (
                  <Button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                      statusFilter === filter.key
                        ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl text-white'
                        : 'glass text-white/90 hover:bg-black/30 backdrop-blur-lg'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Water District</label>
              <select
                className="form-select"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
              >
                <option value="all">All Districts</option>
                {waterDistricts.map(district => (
                  <option key={district.name} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const StatusIcon = statusConfig[report.status].icon;
              const isSubmitting = submitting === report.id;
              
              return (
                <div key={report.id} className="glass rounded-2xl glow-blue-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-white/80">
                            {report.reportNumber}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[report.status].color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[report.status].label}
                          </span>
                          {report.testResult === 'failed' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              ⚠️ Repairs Made
                            </span>
                          )}
                        </div>
                        <p className="text-white/80">{report.customerName}</p>
                      </div>
                      <div className="text-right text-sm text-white/80">
                        Test: {formatDate(report.testDate)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-white/80" />
                          <span className="font-medium">{report.waterDistrict}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white/80">Device:</span>
                          <span className="font-medium">{report.deviceType} - {report.deviceSerial}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-white/80" />
                          <span className="text-white/80">{report.districtEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white/80">Result:</span>
                          <span className={`font-medium ${
                            report.testResult === 'passed' ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {report.testResult.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {report.submissionDate && (
                        <div className="text-sm text-white/80">
                          <span className="text-white/80">Submitted:</span> {formatDate(report.submissionDate)}
                        </div>
                      )}

                      {report.lastError && (
                        <div className="text-sm text-red-300 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl rounded p-2">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          {report.lastError}
                        </div>
                      )}

                      {report.notes && (
                        <div className="text-sm text-white/80 glass rounded p-2">
                          {report.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t mt-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                      
                      <div className="flex space-x-2">
                        {(report.status === 'pending' || report.status === 'rejected') && (
                          <Button 
                            size="sm"
                            asChild
                          >
                            <Link href={`/team-portal/test-reports/${report.id}/submit-district`}>
                              <Send className="h-4 w-4 mr-1" />
                              Submit to District
                            </Link>
                          </Button>
                        )}
                        {report.status === 'rejected' && (
                          <Button size="sm" variant="outline">
                            <Upload className="h-4 w-4 mr-1" />
                            Fix & Resubmit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass rounded-2xl glow-blue-sm p-8 text-center">
              <FileText className="h-12 w-12 text-white/80 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/80 mb-2">No reports found</h3>
              <p className="text-white/80 mb-4">
                No district reports match your current filters
              </p>
              <Button asChild>
                <Link href="/app/test-report">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Test Report
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Water District Information */}
        <div className="mt-6 glass rounded-2xl glow-blue-sm p-4">
          <h3 className="text-lg font-semibold text-white/80 mb-4">Water District Information</h3>
          <div className="space-y-3">
            {waterDistricts.map((district, index) => (
              <div key={index} className="border-b border-blue-500/50 last:border-b-0 pb-3 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-white/80">{district.name}</div>
                    <div className="text-sm text-white/80">{district.email}</div>
                    <div className="text-xs text-white/80">
                      {district.submitMethod === 'email' ? '📧 Email Submission' : '🌐 Online Portal'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/80">{district.turnaround}</div>
                    <div className="text-xs text-white/80">response time</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-white/80">
                  Required: {district.requirements.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-blue-500/50">
        <div className="grid grid-cols-5">
          <Link href="/app" className="flex flex-col items-center py-2 px-1 text-white/80 hover:text-white/80">
            <div className="h-6 w-6 bg-black/30 backdrop-blur-lg rounded"></div>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/app/customers" className="flex flex-col items-center py-2 px-1 text-white/80 hover:text-white/80">
            <Users className="h-6 w-6" />
            <span className="text-xs">Customers</span>
          </Link>
          <Link href="/app/test-report" className="flex flex-col items-center py-2 px-1 text-white/80 hover:text-white/80">
            <Plus className="h-6 w-6" />
            <span className="text-xs">Test</span>
          </Link>
          <Link href="/app/schedule" className="flex flex-col items-center py-2 px-1 text-white/80 hover:text-white/80">
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Schedule</span>
          </Link>
          <Link href="/app/more" className="flex flex-col items-center py-2 px-1 text-blue-300 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-full"></div>
              <div className="w-1 h-1 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-full"></div>
              <div className="w-1 h-1 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-full"></div>
            </div>
            <span className="text-xs font-medium">More</span>
          </Link>
        </div>
      </nav>
      </div>
    </div>
  );
}