'use client';

import { useState } from 'react';
import { Download, Upload, FileText, Database, Clock, AlertCircle } from 'lucide-react';
import { dataExportService, type ExportOptions, type ExportFormat } from '@/lib/data-export';

interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  recordCount?: number;
}

export default function DataExportManager() {
  const [selectedType, setSelectedType] = useState('customers');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const exportTypes = [
    { id: 'customers', label: 'Customer Data', icon: Database },
    { id: 'test_reports', label: 'Test Reports', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'appointments', label: 'Appointments', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: Database }
  ];

  const formatOptions = [
    { id: 'csv' as ExportFormat, label: 'CSV', extension: '.csv' },
    { id: 'json' as ExportFormat, label: 'JSON', extension: '.json' },
    { id: 'pdf' as ExportFormat, label: 'PDF', extension: '.pdf' },
    { id: 'excel' as ExportFormat, label: 'Excel', extension: '.xlsx' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          format: selectedFormat,
          options: {
            includeDeleted: false,
            dateRange: null
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (selectedFormat === 'csv' || selectedFormat === 'json') {
        // For text formats, trigger download directly
        const blob = new Blob([result.data], { 
          type: selectedFormat === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedType}_export_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For binary formats (PDF, Excel), handle as blob
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedType}_export_${new Date().toISOString().split('T')[0]}.${selectedFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Add to export history
      const newJob: ExportJob = {
        id: `export_${Date.now()}`,
        type: selectedType,
        format: selectedFormat,
        status: 'completed',
        createdAt: new Date().toISOString(),
        recordCount: result.recordCount
      };
      setExportJobs(prev => [newJob, ...prev.slice(0, 9)]); // Keep last 10

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportResults(null);

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('type', selectedType);

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();
      setImportResults(result);

    } catch (error) {
      console.error('Import error:', error);
      setImportResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Data Management</h1>
          <p className="text-gray-400">Export and import platform data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Export Section */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Download className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold">Export Data</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {exportTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-3 rounded-lg border transition-colors flex items-center gap-2 text-sm ${
                          selectedType === type.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {formatOptions.map(format => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-2 rounded-lg border transition-colors text-sm ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Data
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Upload className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold">Import Data</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Import File
                </label>
                <input
                  type="file"
                  accept=".csv,.json,.xlsx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {importFile && (
                  <p className="mt-2 text-sm text-gray-400">
                    Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={!importFile || isImporting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Data
                  </>
                )}
              </button>

              {importResults && (
                <div className={`p-4 rounded-lg border ${
                  importResults.success 
                    ? 'border-green-500 bg-green-500/20' 
                    : 'border-red-500 bg-red-500/20'
                }`}>
                  {importResults.success ? (
                    <div>
                      <p className="font-medium text-green-400 mb-2">Import Successful</p>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p>Records imported: {importResults.imported}</p>
                        <p>Records updated: {importResults.updated}</p>
                        <p>Records skipped: {importResults.skipped}</p>
                        {importResults.errors?.length > 0 && (
                          <p className="text-yellow-400">Errors: {importResults.errors.length}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-400">Import Failed</p>
                        <p className="text-sm text-gray-300">{importResults.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export History */}
        {exportJobs.length > 0 && (
          <div className="mt-8 bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Exports</h3>
            <div className="space-y-3">
              {exportJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{job.type} ({job.format.toUpperCase()})</p>
                      <p className="text-sm text-gray-400">
                        {new Date(job.createdAt).toLocaleString()}
                        {job.recordCount && ` • ${job.recordCount} records`}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    job.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : job.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {job.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}