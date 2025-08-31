'use client';

import { useState } from 'react';
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
      icon: <Users className="h-6 w-6 text-blue-600" />,
      format: 'CSV/Excel'
    },
    {
      id: 'test-reports',
      title: 'Test Reports',
      description: 'Export test reports with results and compliance data',
      icon: <FileText className="h-6 w-6 text-green-600" />,
      format: 'CSV/PDF'
    },
    {
      id: 'invoices',
      title: 'Invoice Data',
      description: 'Export billing and payment information',
      icon: <DollarSign className="h-6 w-6 text-purple-600" />,
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/app/more">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Type Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Select Export Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportTypes.map((exportType) => (
                  <div
                    key={exportType.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedExport === exportType.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedExport(exportType.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {exportType.icon}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{exportType.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{exportType.description}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded">
                            {exportType.format}
                          </span>
                        </div>
                      </div>
                      {selectedExport === exportType.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range (for applicable exports) */}
            {(selectedExport === 'test-reports' || selectedExport === 'invoices') && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  <Calendar className="h-5 w-5 inline mr-2" />
                  Date Range
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-2">
                  Leave blank to export all records
                </p>
              </div>
            )}

            {/* Field Selection */}
            {selectedExport && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
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
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Customer Information</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.deviceInfo}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, deviceInfo: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Device Information</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.testResults}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, testResults: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Test Results</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.invoiceData}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, invoiceData: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Invoice Data</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeFields.notes}
                      onChange={(e) => setIncludeFields(prev => ({ ...prev, notes: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Notes & Comments</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Export Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Export Summary</h2>
              
              {selectedExport ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Export Type:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {exportTypes.find(t => t.id === selectedExport)?.title}
                    </p>
                  </div>
                  
                  {(selectedExport === 'test-reports' || selectedExport === 'invoices') && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Date Range:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {dateRange.startDate && dateRange.endDate
                          ? `${dateRange.startDate} to ${dateRange.endDate}`
                          : 'All records'
                        }
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Format:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {exportTypes.find(t => t.id === selectedExport)?.format}
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleExport}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select an export type to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}