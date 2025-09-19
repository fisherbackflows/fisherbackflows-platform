'use client';

import { useState } from 'react';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Settings,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ExportPage() {
  const [selectedExport, setSelectedExport] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [includeFields, setIncludeFields] = useState({
    customerInfo: true,
    deviceInfo: true,
    testResults: true,
    invoiceData: false,
    notes: false
  });

  const exportTypes = [
    {
      id: 'customers',
      title: 'Customer Database',
      description: 'Export all customer information and device details',
      icon: <Users className="h-6 w-6 text-blue-300" />,
      format: 'CSV/Excel'
    },
    {
      id: 'test-reports',
      title: 'Test Reports',
      description: 'Export test reports with results and compliance data',
      icon: <FileText className="h-6 w-6 text-green-300" />,
      format: 'CSV/PDF'
    },
    {
      id: 'invoices',
      title: 'Invoice Data',
      description: 'Export billing and payment information',
      icon: <DollarSign className="h-6 w-6 text-purple-300" />,
      format: 'CSV/Excel'
    },
    {
      id: 'district-reports',
      title: 'District Reports',
      description: 'Export formatted reports for water districts',
      icon: <FileSpreadsheet className="h-6 w-6 text-orange-600" />,
      format: 'Excel/PDF'
    }
  ];

  const handleExport = () => {
    if (!selectedExport) {
      alert('Please select an export type');
      return;
    }

    // Mock export process - replace with actual export logic
    console.log('Exporting:', {
      type: selectedExport,
      dateRange,
      includeFields
    });

    alert(`Export started! Your ${exportTypes.find(t => t.id === selectedExport)?.title} will be downloaded shortly.`);
  };

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Export Data</h1>
            <p className="text-white/60">Export your data in various formats</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Type Selection */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl glow-blue-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Select Export Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportTypes.map((exportType) => (
                  <div
                    key={exportType.id}
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-colors ${
                      selectedExport === exportType.id
                        ? 'border-blue-500 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl'
                        : 'border-blue-500/50 hover:border-blue-500/50'
                    }`}
                    onClick={() => setSelectedExport(exportType.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {exportType.icon}
                      <div className="flex-1">
                        <h3 className="font-medium text-white/80">{exportType.title}</h3>
                        <p className="text-sm text-white/80 mt-1">{exportType.description}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs glass text-white/90 px-2 py-1 rounded">
                            {exportType.format}
                          </span>
                        </div>
                      </div>
                      {selectedExport === exportType.id && (
                        <CheckCircle className="h-5 w-5 text-blue-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range (for applicable exports) */}
            {(selectedExport === 'test-reports' || selectedExport === 'invoices') && (
              <div className="glass rounded-2xl glow-blue-sm p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  <Calendar className="h-5 w-5 inline mr-2" />
                  Date Range
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-white/80 mt-2">
                  Leave blank to export all records
                </p>
              </div>
            )}

            {/* Field Selection */}
            {selectedExport && (
              <div className="glass rounded-2xl glow-blue-sm p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  <Settings className="h-5 w-5 inline mr-2" />
                  Include Fields
                </h2>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.customerInfo}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, customerInfo: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-300 focus:ring-blue-400 border-blue-500/50 rounded"
                    />
                    <span className="text-sm font-medium text-white/80">Customer Information</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.deviceInfo}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, deviceInfo: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-300 focus:ring-blue-400 border-blue-500/50 rounded"
                    />
                    <span className="text-sm font-medium text-white/80">Device Information</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.testResults}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, testResults: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-300 focus:ring-blue-400 border-blue-500/50 rounded"
                    />
                    <span className="text-sm font-medium text-white/80">Test Results</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.invoiceData}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, invoiceData: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-300 focus:ring-blue-400 border-blue-500/50 rounded"
                    />
                    <span className="text-sm font-medium text-white/80">Invoice Data</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.notes}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, notes: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-300 focus:ring-blue-400 border-blue-500/50 rounded"
                    />
                    <span className="text-sm font-medium text-white/80">Notes & Comments</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Export Summary */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl glow-blue-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Export Summary</h2>
              
              {selectedExport ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-white/80">Export Type:</span>
                    <p className="text-sm text-white/80 mt-1">
                      {exportTypes.find(t => t.id === selectedExport)?.title}
                    </p>
                  </div>
                  
                  {(selectedExport === 'test-reports' || selectedExport === 'invoices') && (
                    <div>
                      <span className="text-sm font-medium text-white/80">Date Range:</span>
                      <p className="text-sm text-white/80 mt-1">
                        {dateRange.startDate && dateRange.endDate
                          ? `${dateRange.startDate} to ${dateRange.endDate}`
                          : 'All records'
                        }
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-white/80">Format:</span>
                    <p className="text-sm text-white/80 mt-1">
                      {exportTypes.find(t => t.id === selectedExport)?.format}
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleExport}
                      className="w-full glass-btn-primary hover:glow-blue"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 text-white/80 mx-auto mb-4" />
                  <p className="text-white/80">Select an export type to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}