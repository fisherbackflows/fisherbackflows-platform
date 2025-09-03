'use client';

import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Settings,
  Search,
  Filter,
  Calendar,
  Shield,
  Award,
  Clock,
  MapPin,
  Printer,
  Mail,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import Link from 'next/link';

// Mock data for test reports and certificates
const mockReports = [
  {
    id: 'RPT-2024-001',
    certificateId: 'CERT-WA-2024-001',
    testDate: '2024-12-10',
    issueDate: '2024-12-10',
    expirationDate: '2025-12-10',
    deviceLocation: '123 Main St - Backyard',
    deviceSerial: 'BF-2023-001',
    deviceType: 'Reduced Pressure Zone',
    deviceSize: '3/4"',
    deviceMake: 'Watts',
    deviceModel: 'Series 909',
    testResult: 'Pass',
    technician: 'Mike Fisher',
    technicianCertification: 'WA-CERT-12345',
    testPressures: {
      staticPressure: 65,
      workingPressure: 55,
      reducedPressure: 50,
      reliefValveOpening: 45
    },
    compliance: 'Compliant',
    notes: 'Device operating within acceptable parameters',
    nextTestDue: '2025-12-10',
    daysUntilExpiration: 45,
    photos: ['device_front.jpg', 'pressure_gauge.jpg'],
    status: 'active'
  },
  {
    id: 'RPT-2024-002',
    certificateId: 'CERT-WA-2024-002',
    testDate: '2024-11-15',
    issueDate: '2024-11-15',
    expirationDate: '2025-11-15',
    deviceLocation: '123 Main St - Front Yard',
    deviceSerial: 'BF-2023-002',
    deviceType: 'Double Check Valve',
    deviceSize: '1"',
    deviceMake: 'Febco',
    deviceModel: '860',
    testResult: 'Pass',
    technician: 'Sarah Johnson',
    technicianCertification: 'WA-CERT-67890',
    testPressures: {
      staticPressure: 70,
      workingPressure: 60,
      check1Pressure: 58,
      check2Pressure: 56
    },
    compliance: 'Compliant',
    notes: 'Both check valves functioning properly',
    nextTestDue: '2025-11-15',
    daysUntilExpiration: 80,
    photos: ['device_front.jpg'],
    status: 'active'
  },
  {
    id: 'RPT-2024-003',
    certificateId: 'CERT-WA-2024-003',
    testDate: '2024-10-20',
    issueDate: '2024-10-25',
    expirationDate: '2025-10-20',
    deviceLocation: '456 Oak Ave - Basement',
    deviceSerial: 'BF-2024-003',
    deviceType: 'Reduced Pressure Zone',
    deviceSize: '2"',
    deviceMake: 'Zurn Wilkins',
    deviceModel: '350',
    testResult: 'Fail',
    technician: 'Mike Fisher',
    technicianCertification: 'WA-CERT-12345',
    testPressures: {
      staticPressure: 75,
      workingPressure: 65,
      reducedPressure: 63,
      reliefValveOpening: 62
    },
    compliance: 'Non-Compliant',
    notes: 'Relief valve not opening at proper pressure. Requires immediate repair.',
    nextTestDue: 'Immediate',
    daysUntilExpiration: -30,
    photos: ['device_front.jpg', 'failed_relief_valve.jpg', 'pressure_test.jpg'],
    status: 'failed',
    repairRequired: true,
    followUpTest: 'RPT-2024-004'
  }
];

export default function ReportsPage() {
  const [reports] = useState(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const getResultColor = (result: string) => {
    switch (result.toLowerCase()) {
      case 'pass': return 'text-green-400 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border-green-400/30';
      case 'fail': return 'text-red-400 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border-red-400/30';
      case 'conditional': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      default: return 'text-blue-400 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border-blue-400/30';
    }
  };

  const getComplianceColor = (compliance: string) => {
    switch (compliance.toLowerCase()) {
      case 'compliant': return 'text-green-400';
      case 'non-compliant': return 'text-red-400';
      case 'conditional': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const getExpirationColor = (days: number) => {
    if (days < 0) return 'text-red-400';
    if (days <= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.deviceLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.certificateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.deviceSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.technician.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && report.status === 'active') ||
                         (filterStatus === 'failed' && report.status === 'failed') ||
                         (filterStatus === 'expiring' && report.daysUntilExpiration <= 30);

    return matchesSearch && matchesFilter;
  });

  const reportStats = {
    total: reports.length,
    active: reports.filter(r => r.status === 'active').length,
    failed: reports.filter(r => r.status === 'failed').length,
    expiring: reports.filter(r => r.daysUntilExpiration <= 30 && r.status === 'active').length
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/portal/dashboard">
                <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-3 py-2 rounded-2xl">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Logo width={160} height={128} />
            </div>
            <div className="flex items-center space-x-4">
              <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 ">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Test Reports & Certificates</h1>
          <p className="text-white/80">
            View and download your backflow test certificates and compliance reports.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold">{reportStats.total}</span>
            </div>
            <h3 className="font-medium mb-1">Total Reports</h3>
            <p className="text-white/80 text-sm">All test certificates</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <Award className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-green-400">{reportStats.active}</span>
            </div>
            <h3 className="font-medium mb-1">Active Certificates</h3>
            <p className="text-white/80 text-sm">Currently valid</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <Clock className={`h-6 w-6 ${reportStats.expiring > 0 ? 'text-yellow-400' : 'text-green-400'}`} />
              </div>
              <span className={`text-2xl font-bold ${reportStats.expiring > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {reportStats.expiring}
              </span>
            </div>
            <h3 className="font-medium mb-1">Expiring Soon</h3>
            <p className="text-white/80 text-sm">Within 30 days</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <XCircle className={`h-6 w-6 ${reportStats.failed > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
              <span className={`text-2xl font-bold ${reportStats.failed > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {reportStats.failed}
              </span>
            </div>
            <h3 className="font-medium mb-1">Failed Tests</h3>
            <p className="text-white/80 text-sm">Require attention</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Reports */}
          <div className="lg:col-span-2 space-y-8">
            {/* Search and Filter */}
            <div className="glass border border-blue-400 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/90" />
                  <input
                    type="text"
                    placeholder="Search reports by location, certificate ID, or technician..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/90 border border-blue-400 glass text-black w-full pl-10 pr-4 py-3 rounded-2xl placeholder-gray-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-white/80" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-blue-400 glass text-white px-4 py-3 rounded-2xl text-white bg-transparent"
                  >
                    <option value="all" className="glass">All Reports</option>
                    <option value="active" className="glass">Active</option>
                    <option value="failed" className="glass">Failed</option>
                    <option value="expiring" className="glass">Expiring Soon</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Test Certificates</h2>
              </div>

              <div className="space-y-6">
                {filteredReports.map((report) => (
                  <div key={report.id} className={`glass border border-blue-400 rounded-2xl p-6 hover:glass transition-colors ${
                    report.status === 'failed' ? 'border-red-500/30 border' : ''
                  }`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg text-white">{report.certificateId}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResultColor(report.testResult)}`}>
                            {report.testResult}
                          </span>
                          {report.repairRequired && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium border text-red-400 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border-red-400/30">
                              Repair Required
                            </span>
                          )}
                        </div>
                        <p className="text-white/90 font-medium mb-1">{report.deviceLocation}</p>
                        <p className="text-white/80 text-sm">{report.deviceType} • {report.deviceSize} • {report.deviceMake} {report.deviceModel}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-white/80 text-sm mb-1">Test Date</div>
                        <div className="font-medium text-white">{new Date(report.testDate).toLocaleDateString()}</div>
                        <div className={`text-sm font-medium ${getComplianceColor(report.compliance)}`}>
                          {report.compliance}
                        </div>
                      </div>
                    </div>

                    {/* Test Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3">
                        <div className="flex items-center text-blue-400 mb-2">
                          <Calendar className="h-4 w-4 mr-2" />
                          Expiration
                        </div>
                        <p className="text-white/90 font-medium">
                          {new Date(report.expirationDate).toLocaleDateString()}
                        </p>
                        <p className={`text-xs font-medium ${getExpirationColor(report.daysUntilExpiration)}`}>
                          {report.daysUntilExpiration < 0 ? 'EXPIRED' : 
                           report.daysUntilExpiration === 0 ? 'Expires today' :
                           `${report.daysUntilExpiration} days remaining`}
                        </p>
                      </div>

                      <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3">
                        <div className="flex items-center text-blue-400 mb-2">
                          <Shield className="h-4 w-4 mr-2" />
                          Technician
                        </div>
                        <p className="text-white/90 font-medium">{report.technician}</p>
                        <p className="text-white/80 text-xs">Cert: {report.technicianCertification}</p>
                      </div>

                      <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3">
                        <div className="flex items-center text-blue-400 mb-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          Device Info
                        </div>
                        <p className="text-white/90 font-medium text-sm">S/N: {report.deviceSerial}</p>
                        <p className="text-white/80 text-xs">{report.photos.length} photo{report.photos.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Test Results */}
                    <div className="glass border border-blue-400 rounded-2xl p-4 mb-4">
                      <h4 className="text-white/90 font-medium mb-3 text-sm">Test Pressures (PSI)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {Object.entries(report.testPressures).map(([key, value]) => (
                          <div key={key}>
                            <div className="text-white/50 mb-1">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </div>
                            <div className="text-white/90 font-medium">{value} PSI</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {report.notes && (
                      <div className="glass border border-blue-400 rounded-2xl p-3 mb-4">
                        <p className="text-white/50 text-xs mb-1">Technician Notes</p>
                        <p className="text-white/90 text-sm">{report.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <Button className="glass-btn-primary hover:glow-blue text-white px-4 py-2 rounded-2xl text-sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                      <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl text-sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl text-sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      {report.repairRequired && (
                        <Button className="glass-btn-primary hover:glow-blue text-white px-4 py-2 rounded-2xl text-sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Repair
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredReports.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-white/90 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white/80 mb-2">No reports found</h3>
                  <p className="text-white/90 mb-6">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Your test certificates will appear here after testing is completed.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-8">
            {/* Failed Tests Alert */}
            {reportStats.failed > 0 && (
              <div className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm border border-red-500/30 glow-red-sm">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
                  <h2 className="text-xl font-bold text-red-400">Immediate Action Required</h2>
                </div>
                
                <p className="text-white/90 text-sm mb-4">
                  You have {reportStats.failed} device{reportStats.failed > 1 ? 's' : ''} that failed testing and require immediate attention.
                </p>

                <Button className="w-full glass-btn-primary hover:glow-blue text-white py-3 rounded-2xl">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Repairs
                </Button>
              </div>
            )}

            {/* Expiring Certificates */}
            {reportStats.expiring > 0 && (
              <div className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm border border-yellow-500/30">
                <div className="flex items-center mb-4">
                  <Clock className="h-6 w-6 text-yellow-400 mr-3" />
                  <h2 className="text-xl font-bold text-yellow-400">Expiring Soon</h2>
                </div>
                
                <p className="text-white/90 text-sm mb-4">
                  {reportStats.expiring} certificate{reportStats.expiring > 1 ? 's' : ''} expiring within 30 days.
                </p>

                <Button className="w-full glass-btn-primary hover:glow-blue text-white py-3 rounded-2xl">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Renewal Tests
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-start">
                  <Download className="h-5 w-5 mr-3" />
                  Download All Certificates
                </Button>
                
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-start">
                  <Printer className="h-5 w-5 mr-3" />
                  Print Compliance Report
                </Button>
                
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-start">
                  <Mail className="h-5 w-5 mr-3" />
                  Email Certificates
                </Button>
                
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-start">
                  <Calendar className="h-5 w-5 mr-3" />
                  Schedule Next Test
                </Button>
              </div>
            </div>

            {/* Compliance Info */}
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-lg font-bold text-blue-400 mb-4">Washington State Compliance</h2>
              
              <div className="space-y-3 text-sm text-white/90">
                <div>
                  <strong>WAC 246-290-490:</strong> Backflow assemblies must be tested annually by certified testers.
                </div>
                <div>
                  <strong>Deadline:</strong> Tests must be completed by the anniversary date shown on your certificate.
                </div>
                <div>
                  <strong>Penalties:</strong> Non-compliance may result in water service disconnection.
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-lg font-bold text-blue-400 mb-4">Certificate Support</h2>
              
              <div className="space-y-3 text-sm">
                <p className="text-white/90">
                  Questions about your certificates or need official copies?
                </p>
                <div className="space-y-2">
                  <a href="tel:2532788692" className="flex items-center text-white/90 hover:text-blue-400 transition-colors">
                    📞 (253) 278-8692
                  </a>
                  <a href="mailto:reports@fisherbackflows.com" className="flex items-center text-white/90 hover:text-blue-400 transition-colors">
                    ✉️ reports@fisherbackflows.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}