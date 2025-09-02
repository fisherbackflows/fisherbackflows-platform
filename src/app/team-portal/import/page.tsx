'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Download,
  Info
} from 'lucide-react';
import Link from 'next/link';

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState('customers');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const importTypes = [
    {
      id: 'customers',
      title: 'Customer Data',
      description: 'Import customer information and device details',
      requiredFields: ['name', 'email', 'address', 'device_type'],
      optionalFields: ['phone', 'notes', 'last_tested', 'next_due']
    },
    {
      id: 'test-results',
      title: 'Test Results',
      description: 'Import historical test results',
      requiredFields: ['customer_id', 'test_date', 'result'],
      optionalFields: ['technician', 'notes', 'device_pressure']
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a CSV or Excel file (.csv, .xls, .xlsx)');
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    setIsUploading(true);
    
    try {
      // Mock import process - replace with actual import logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful result
      const mockResult = {
        success: true,
        message: 'Import completed successfully!',
        details: `Imported 25 records from ${selectedFile.name}`
      };
      
      setUploadResult(mockResult);
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Import failed',
        details: 'There was an error processing your file. Please check the format and try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const selectedType = importTypes.find(t => t.id === importType);
    if (!selectedType) return;

    // Mock template download - replace with actual template generation
    const headers = [...selectedType.requiredFields, ...selectedType.optionalFields];
    const csvContent = headers.join(',') + '\\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${importType}_template.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const selectedTypeInfo = importTypes.find(t => t.id === importType);

  return (
    <div className="min-h-screen bg-black">
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
      {/* Header */}
      <div className="glass glow-blue-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/app/more">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white/80">Import Data</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Import Form */}
          <div className="lg:col-span-2">
            {/* Import Type Selection */}
            <div className="glass rounded-2xl glow-blue-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Select Import Type</h2>
              
              <div className="space-y-3">
                {importTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-start p-4 border-2 rounded-2xl cursor-pointer transition-colors ${
                      importType === type.id
                        ? 'border-blue-500 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl'
                        : 'border-blue-500/50 hover:border-blue-500/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importType"
                      value={type.id}
                      checked={importType === type.id}
                      onChange={(e) => setImportType(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-white/80">{type.title}</h3>
                      <p className="text-sm text-white/80 mt-1">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="glass rounded-2xl glow-blue-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Upload File</h2>
              
              <div className="border-2 border-dashed border-blue-500/50 rounded-2xl p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-white/80 mx-auto mb-4" />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/80">{selectedFile.name}</p>
                    <p className="text-xs text-white/80">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-white/80">
                      Click to select a file or drag and drop
                    </p>
                    <p className="text-xs text-white/80">
                      Supports CSV, XLS, and XLSX files
                    </p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Import Button */}
              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isUploading}
                  className="glass-btn-primary hover:glow-blue disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </>
                  )}
                </Button>
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className={`mt-6 p-4 rounded-2xl ${
                  uploadResult.success ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200' : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl border border-red-200'
                }`}>
                  <div className="flex items-start">
                    {uploadResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-300 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-300 mr-3 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        uploadResult.success ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {uploadResult.message}
                      </h3>
                      {uploadResult.details && (
                        <p className={`text-sm mt-1 ${
                          uploadResult.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {uploadResult.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Import Info */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl glow-blue-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Import Information</h2>
              
              {selectedTypeInfo && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-white/80 mb-2">Required Fields</h3>
                    <ul className="text-sm text-white/80 space-y-1">
                      {selectedTypeInfo.requiredFields.map((field, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl rounded-full mr-2"></div>
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-white/80 mb-2">Optional Fields</h3>
                    <ul className="text-sm text-white/80 space-y-1">
                      {selectedTypeInfo.optionalFields.map((field, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-black/30 backdrop-blur-lg rounded-full mr-2"></div>
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-300 mr-3 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Import Tips:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Use the template for best results</li>
                      <li>• Ensure all required fields are filled</li>
                      <li>• Date format: YYYY-MM-DD</li>
                      <li>• Remove empty rows</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}