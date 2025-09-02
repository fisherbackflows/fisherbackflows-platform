'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Upload,
  Download,
  FileText,
  Database,
  Users,
  Wrench,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  Settings,
  Info,
  X
} from 'lucide-react';

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
}

const dataTypes = [
  { 
    value: 'customers', 
    label: 'Customers', 
    icon: Users,
    description: 'Customer accounts and contact information',
    fields: ['first_name', 'last_name', 'email', 'phone', 'address_line1', 'city', 'state', 'zip_code']
  },
  { 
    value: 'devices', 
    label: 'Devices', 
    icon: Wrench,
    description: 'Backflow devices and equipment records',
    fields: ['customer_email', 'device_type', 'make', 'model', 'serial_number', 'location', 'size_inches']
  },
  { 
    value: 'appointments', 
    label: 'Appointments', 
    icon: Calendar,
    description: 'Scheduled services and testing appointments',
    fields: ['customer_email', 'scheduled_date', 'scheduled_time_start', 'appointment_type', 'technician_email']
  },
  { 
    value: 'test_reports', 
    label: 'Test Reports', 
    icon: FileText,
    description: 'Testing results and compliance reports',
    fields: ['test_date', 'test_type', 'passed', 'pressure_reading_psi', 'technician_signature']
  },
  { 
    value: 'invoices', 
    label: 'Invoices', 
    icon: Receipt,
    description: 'Billing and payment records',
    fields: ['customer_email', 'invoice_date', 'total_amount', 'status', 'due_date']
  }
];

export default function DataManagementPage() {
  const [selectedDataType, setSelectedDataType] = useState<string>('customers');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);
  const [skipValidation, setSkipValidation] = useState<boolean>(false);
  
  const [importing, setImporting] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const extension = file.name.toLowerCase().split('.').pop();
      if (!['csv', 'json'].includes(extension || '')) {
        setError('Please select a CSV or JSON file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('dataType', selectedDataType);
      formData.append('updateExisting', updateExisting.toString());
      formData.append('skipValidation', skipValidation.toString());

      const response = await fetch('/api/data/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setImportResult(result.result);
        setSuccess(result.message);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.error || 'Failed to import data');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError('Network error occurred during import');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const params = new URLSearchParams({
        type: selectedDataType,
        format: exportFormat,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(includeArchived && { includeArchived: 'true' })
      });

      const response = await fetch(`/api/data/export?${params}`);

      if (response.ok) {
        if (exportFormat === 'json') {
          const result = await response.json();
          // Download JSON file
          const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedDataType}_export_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          // CSV download handled by browser
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedDataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setSuccess(`${selectedDataType.charAt(0).toUpperCase() + selectedDataType.slice(1)} exported successfully`);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Network error occurred during export');
    } finally {
      setExporting(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setImportResult(null);
  };

  const selectedDataTypeInfo = dataTypes.find(dt => dt.value === selectedDataType);

  return (
    <div className="min-h-screen bg-black p-4">
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Data Management</h1>
          <p className="text-gray-400">Import and export data for bulk operations</p>
        </div>

        {/* Messages */}
        {(error || success || importResult) && (
          <div className="mb-6">
            {error && (
              <div className="glass rounded-xl p-4 border border-red-400 glow-red-sm mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-red-300">{error}</p>
                  </div>
                  <button onClick={clearMessages}>
                    <X className="h-4 w-4 text-red-400 hover:text-red-300" />
                  </button>
                </div>
              </div>
            )}

            {success && (
              <div className="glass rounded-xl p-4 border border-green-400 glow-green-sm mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <p className="text-green-300">{success}</p>
                  </div>
                  <button onClick={clearMessages}>
                    <X className="h-4 w-4 text-green-400 hover:text-green-300" />
                  </button>
                </div>
              </div>
            )}

            {importResult && (
              <div className="glass rounded-xl p-4 border border-blue-400 glow-blue-sm mb-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold">Import Results</h3>
                  <button onClick={clearMessages}>
                    <X className="h-4 w-4 text-blue-400 hover:text-blue-300" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{importResult.success}</div>
                    <div className="text-sm text-gray-400">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{importResult.errors.length}</div>
                    <div className="text-sm text-gray-400">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{importResult.warnings.length}</div>
                    <div className="text-sm text-gray-400">Warnings</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto">
                    <h4 className="text-red-400 font-medium mb-2">Errors:</h4>
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-red-300 mb-1">
                        Row {error.row}: {error.error}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-sm text-gray-400">
                        ... and {importResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Type Selection */}
          <div className="glass rounded-2xl p-6 border border-blue-400 glow-blue-sm">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-400" />
              Select Data Type
            </h2>

            <div className="space-y-3">
              {dataTypes.map((dataType) => {
                const Icon = dataType.icon;
                return (
                  <div
                    key={dataType.value}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedDataType === dataType.value
                        ? 'border-blue-400 glass-bright glow-blue-sm'
                        : 'border-gray-600 glass hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedDataType(dataType.value)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${selectedDataType === dataType.value ? 'text-blue-400' : 'text-gray-400'}`} />
                      <div>
                        <h3 className="font-medium text-white">{dataType.label}</h3>
                        <p className="text-sm text-gray-400">{dataType.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Field Information */}
            {selectedDataTypeInfo && (
              <div className="mt-4 p-3 glass rounded-xl border border-gray-600">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  Required Fields for {selectedDataTypeInfo.label}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDataTypeInfo.fields.map(field => (
                    <span key={field} className="px-2 py-1 bg-blue-400/20 text-blue-300 rounded text-xs">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Import Section */}
          <div className="glass rounded-2xl p-6 border border-green-400 glow-green-sm">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Upload className="h-6 w-6 text-green-400" />
              Import Data
            </h2>

            <div className="space-y-4">
              {/* File Selection */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Select File (CSV or JSON)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="w-full p-3 glass rounded-xl border border-gray-600 text-white bg-black/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-green-300">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Import Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="text-green-400 focus:ring-green-400"
                  />
                  <span className="text-gray-300">Update existing records</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={skipValidation}
                    onChange={(e) => setSkipValidation(e.target.checked)}
                    className="text-green-400 focus:ring-green-400"
                  />
                  <span className="text-gray-300">Skip validation (use with caution)</span>
                </label>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || !selectedFile}
                className="w-full glass rounded-xl border border-green-400 text-white hover:border-green-300 hover:bg-green-400/10"
              >
                {importing ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Import {selectedDataTypeInfo?.label}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Export Section */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-purple-400 glow-purple-sm">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Download className="h-6 w-6 text-purple-400" />
              Export Data
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Export Format */}
              <div>
                <label className="block text-white font-medium mb-2">Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                  className="w-full p-3 glass rounded-xl border border-gray-600 text-white bg-black/20 focus:border-purple-400"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-white font-medium mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full p-3 glass rounded-xl border border-gray-600 text-white bg-black/20 focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full p-3 glass rounded-xl border border-gray-600 text-white bg-black/20 focus:border-purple-400"
                />
              </div>

              {/* Export Options */}
              <div className="flex items-end">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="text-purple-400 focus:ring-purple-400"
                  />
                  <span className="text-gray-300 text-sm">Include archived</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full glass rounded-xl border border-purple-400 text-white hover:border-purple-300 hover:bg-purple-400/10"
            >
              {exporting ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  {exportFormat === 'csv' ? (
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                  ) : (
                    <FileJson className="h-5 w-5 mr-2" />
                  )}
                  Export {selectedDataTypeInfo?.label} as {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 glass rounded-2xl p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
            <Settings className="h-5 w-5 text-gray-400" />
            Usage Instructions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">Import Guidelines:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Use CSV or JSON format files only</li>
                <li>• Include required fields for selected data type</li>
                <li>• Use customer_email to link devices and appointments</li>
                <li>• Check "Update existing" to modify current records</li>
                <li>• Review import results for any errors or warnings</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Export Options:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• CSV format is ideal for spreadsheet applications</li>
                <li>• JSON format preserves data structure and relationships</li>
                <li>• Use date filters to export specific time ranges</li>
                <li>• Include archived data for complete historical exports</li>
                <li>• Large exports may take several seconds to complete</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}