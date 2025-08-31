'use client';

import { useState } from 'react';
import { Download, Upload, FileText, Database, Clock, AlertCircle, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard">
              <Button className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Data Management</h1>
              <p className="text-slate-600 mt-1">Export and import platform data</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Professional Export Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Export Data</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Data Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {exportTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-3 rounded-lg border transition-colors duration-200 flex items-center gap-2 text-sm ${
                          selectedType === type.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50'
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
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {formatOptions.map(format => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-3 rounded-lg border transition-colors duration-200 text-sm font-medium ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Professional Import Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Import Data</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Import File
                </label>
                <input
                  type="file"
                  accept=".csv,.json,.xlsx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:font-medium transition-colors duration-200"
                />
                {importFile && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700 font-medium">
                      Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={!importFile || isImporting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Data
                  </>
                )}
              </Button>

              {importResults && (
                <div className={`p-4 rounded-lg border ${
                  importResults.success 
                    ? 'border-emerald-200 bg-emerald-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  {importResults.success ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-emerald-800 mb-3">Import Successful</p>
                        <div className="text-sm text-emerald-700 space-y-1">
                          <p>Records imported: {importResults.imported}</p>
                          <p>Records updated: {importResults.updated}</p>
                          <p>Records skipped: {importResults.skipped}</p>
                          {importResults.errors?.length > 0 && (
                            <p className="text-amber-700">Errors: {importResults.errors.length}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 mb-2">Import Failed</p>
                        <p className="text-sm text-red-700">{importResults.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Export History */}
        {exportJobs.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Exports</h3>
            <div className="space-y-3">
              {exportJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <FileText className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{job.type} ({job.format.toUpperCase()})</p>
                      <p className="text-sm text-slate-600">
                        {new Date(job.createdAt).toLocaleString()}
                        {job.recordCount && ` • ${job.recordCount} records`}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-md text-xs font-medium border ${
                    job.status === 'completed' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : job.status === 'failed'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
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