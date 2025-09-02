'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Gauge,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCustomerData } from '@/hooks/useCustomerData';

export default function CustomerReportsPage() {
  const { customer, loading, error } = useCustomerData();
  const [testReports, setTestReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (customer?.id) {
      loadTestReports();
    }
  }, [customer]);

  async function loadTestReports() {
    try {
      setLoadingReports(true);
      const token = localStorage.getItem('portal_token');
      
      const response = await fetch(`/api/test-reports?customerId=${customer.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestReports(data.testReports || []);
      }
    } catch (error) {
      console.error('Failed to load test reports:', error);
    } finally {
      setLoadingReports(false);
    }
  }

  async function downloadReportPDF(reportId) {
    try {
      const token = localStorage.getItem('portal_token');
      
      const response = await fetch(`/api/test-reports/${reportId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-report-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download PDF');
        alert('Failed to download report. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('An error occurred while downloading the report.');
    }
  }

  if (loading || loadingReports) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading your test reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Reports</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-glow">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const filteredReports = filterStatus === 'all' 
    ? testReports 
    : testReports.filter(report => 
        filterStatus === 'passed' ? report.test_passed : !report.test_passed
      );

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />

      {/* Header */}
      <header className="glass border-b border-blue-400 sticky top-0 z-50 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white">
                Fisher Backflows
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/portal/dashboard" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Dashboard
                </Link>
                <Link href="/portal/devices" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Devices
                </Link>
                <Link href="/portal/billing" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Billing
                </Link>
                <Link href="/portal/reports" className="px-4 py-2 rounded-2xl glass-btn-primary text-white glow-blue-sm font-medium">
                  Reports
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="font-semibold text-white">{customer?.name}</p>
                <p className="text-sm text-white/80">Account: {customer?.accountNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">

      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/portal/dashboard">
              <Button variant="ghost" className="text-blue-300 hover:text-white">
                ← Back to Dashboard
              </Button>
            </Link>
            <nav className="flex space-x-4">
              <Link href="/portal/billing">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Billing</Button>
              </Link>
              <Link href="/portal/devices">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Devices</Button>
              </Link>
              <Link href="/portal/reports">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Reports</Button>
              </Link>
              <Link href="/portal/schedule">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Schedule</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white">Test Reports</h1>
              <p className="text-white/90 text-lg">View your backflow test history and compliance reports</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Total Reports</p>
              <p className="text-3xl font-bold text-blue-400">{testReports.length}</p>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-4 mb-6">
          <Button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-2xl ${
              filterStatus === 'all' 
                ? 'glass-btn-primary glow-blue-sm' 
                : 'btn-glass'
            }`}
          >
            All Reports ({testReports.length})
          </Button>
          <Button
            onClick={() => setFilterStatus('passed')}
            className={`px-4 py-2 rounded-2xl ${
              filterStatus === 'passed' 
                ? 'glass-btn-primary glow-blue-sm' 
                : 'btn-glass'
            }`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Passed ({testReports.filter(r => r.test_passed).length})
          </Button>
          <Button
            onClick={() => setFilterStatus('failed')}
            className={`px-4 py-2 rounded-2xl ${
              filterStatus === 'failed' 
                ? 'glass-btn-primary glow-blue-sm' 
                : 'btn-glass'
            }`}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Failed ({testReports.filter(r => !r.test_passed).length})
          </Button>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.length === 0 ? (
            <div className="glass rounded-2xl p-12 border border-blue-400 text-center">
              <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No test reports found</p>
              <p className="text-white/40 text-sm mt-2">Test reports will appear here after your devices are tested</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="glass rounded-2xl p-6 border border-blue-400 hover:glow-blue-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      report.test_passed 
                        ? 'bg-green-500/20' 
                        : 'bg-red-500/20'
                    }`}>
                      {report.test_passed ? (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {report.test_type === 'annual' ? 'Annual Test' : report.test_type}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-white/60 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {report.test_date ? new Date(report.test_date).toLocaleDateString() : 'N/A'}
                        </span>
                        {report.device && (
                          <span className="text-sm text-white/60 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            Device #{report.device_id?.slice(-8)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Pressure Readings */}
                    {(report.initial_pressure || report.final_pressure) && (
                      <div className="text-right">
                        <p className="text-xs text-white/60">Pressure Drop</p>
                        <p className="text-sm font-bold text-white flex items-center">
                          <Gauge className="h-4 w-4 mr-1 text-blue-400" />
                          {Math.abs((report.initial_pressure || 0) - (report.final_pressure || 0)).toFixed(1)} PSI
                        </p>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      report.test_passed 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {report.test_passed ? 'PASSED' : 'FAILED'}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setSelectedReport(report)}
                        className="btn-glass p-2 rounded-2xl"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        className="btn-glass p-2 rounded-2xl"
                        title="Download Report"
                        onClick={() => downloadReportPDF(report.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                {report.notes && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-xl">
                    <p className="text-sm text-white/80">{report.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-8 border border-blue-400 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Test Report Details</h2>
                <Button
                  onClick={() => setSelectedReport(null)}
                  className="btn-glass p-2 rounded-2xl"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm">Test Date</label>
                    <p className="text-white font-bold">
                      {selectedReport.test_date ? new Date(selectedReport.test_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Test Type</label>
                    <p className="text-white font-bold capitalize">{selectedReport.test_type || 'Annual'}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Initial Pressure</label>
                    <p className="text-white font-bold">{selectedReport.initial_pressure || 0} PSI</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Final Pressure</label>
                    <p className="text-white font-bold">{selectedReport.final_pressure || 0} PSI</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Pressure Drop</label>
                    <p className="text-white font-bold">
                      {Math.abs((selectedReport.initial_pressure || 0) - (selectedReport.final_pressure || 0)).toFixed(1)} PSI
                    </p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Result</label>
                    <p className={`font-bold ${
                      selectedReport.test_passed ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedReport.test_passed ? 'PASSED' : 'FAILED'}
                    </p>
                  </div>
                </div>
                
                {selectedReport.certifier_name && (
                  <div>
                    <label className="text-white/60 text-sm">Certified By</label>
                    <p className="text-white">{selectedReport.certifier_name}</p>
                  </div>
                )}
                
                {selectedReport.notes && (
                  <div>
                    <label className="text-white/60 text-sm">Notes</label>
                    <p className="text-white">{selectedReport.notes}</p>
                  </div>
                )}
                
                {selectedReport.submitted_to_district && (
                  <div className="mt-4 p-3 bg-green-500/10 rounded-xl">
                    <p className="text-sm text-green-400">
                      ✓ Submitted to water district on {
                        selectedReport.district_submission_date 
                          ? new Date(selectedReport.district_submission_date).toLocaleDateString()
                          : 'N/A'
                      }
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <Button
                  onClick={() => setSelectedReport(null)}
                  className="btn-glass px-6 py-2 rounded-2xl"
                >
                  Close
                </Button>
                <Button
                  className="btn-glow px-6 py-2 rounded-2xl"
                  onClick={() => downloadReportPDF(selectedReport.id)}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}