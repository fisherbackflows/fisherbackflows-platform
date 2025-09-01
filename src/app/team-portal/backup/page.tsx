'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Download,
  Upload,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Database,
  Calendar,
  HardDrive
} from 'lucide-react';
import Link from 'next/link';

interface BackupItem {
  id: string;
  name: string;
  date: string;
  size: string;
  type: 'auto' | 'manual';
  status: 'complete' | 'failed';
}

export default function BackupPage() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupResult, setBackupResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const recentBackups: BackupItem[] = [
    {
      id: '1',
      name: 'Auto Backup - Daily',
      date: '2024-03-15 02:00:00',
      size: '12.5 MB',
      type: 'auto',
      status: 'complete'
    },
    {
      id: '2',
      name: 'Manual Backup - Before Update',
      date: '2024-03-10 14:30:00',
      size: '11.8 MB',
      type: 'manual',
      status: 'complete'
    },
    {
      id: '3',
      name: 'Auto Backup - Weekly',
      date: '2024-03-08 02:00:00',
      size: '11.2 MB',
      type: 'auto',
      status: 'complete'
    }
  ];

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupResult(null);

    try {
      // Mock backup process - replace with actual backup logic
      await new Promise(resolve => setTimeout(resolve, 3000));

      setBackupResult({
        success: true,
        message: 'Backup created successfully! Your data has been securely backed up.'
      });
    } catch (error) {
      setBackupResult({
        success: false,
        message: 'Backup failed. Please try again or contact support.'
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = (backupId: string) => {
    // Mock download - replace with actual backup download
    alert(`Downloading backup ${backupId}...`);
  };

  const handleRestoreBackup = (backupId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to restore this backup? This will replace all current data.'
    );
    
    if (confirmed) {
      // Mock restore process - replace with actual restore logic
      alert(`Restoring backup ${backupId}... This may take a few minutes.`);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Backup */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    <Database className="h-5 w-5 inline mr-2" />
                    Create Manual Backup
                  </h2>
                  <p className="text-gray-800">
                    Create a backup of all your business data including customers, test reports, and invoices.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  className="bg-blue-700 hover:bg-blue-700"
                >
                  {isCreatingBackup ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Create Backup Now
                    </>
                  )}
                </Button>

                <div className="text-sm text-gray-700">
                  Last backup: Today at 2:00 AM (Automatic)
                </div>
              </div>

              {backupResult && (
                <div className={`mt-4 p-4 rounded-lg ${
                  backupResult.success ? 'bg-green-200 border border-green-200' : 'bg-red-200 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    {backupResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-800 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-800 mr-3 mt-0.5" />
                    )}
                    <p className={`text-sm ${
                      backupResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {backupResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Backup History */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                <Clock className="h-5 w-5 inline mr-2" />
                Backup History
              </h2>

              <div className="space-y-4">
                {recentBackups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        backup.status === 'complete' ? 'bg-green-300' : 'bg-red-300'
                      }`}>
                        {backup.status === 'complete' ? (
                          <CheckCircle className="h-5 w-5 text-green-800" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-800" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{backup.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-700 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {backup.date}
                          </span>
                          <span className="flex items-center">
                            <HardDrive className="h-4 w-4 mr-1" />
                            {backup.size}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            backup.type === 'auto' ? 'bg-blue-300 text-blue-700' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {backup.type === 'auto' ? 'Automatic' : 'Manual'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadBackup(backup.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreBackup(backup.id)}
                        className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Backup Schedule</h3>
                <div className="space-y-2 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span>Daily backups:</span>
                    <span className="text-green-800 font-medium">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>2:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retention:</span>
                    <span>30 days</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">What's Included</h3>
                <ul className="space-y-2 text-sm text-gray-800">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Customer database
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Test reports
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Invoice records
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Appointment schedule
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    System settings
                  </li>
                </ul>
              </div>

              <div className="border-t pt-6">
                <div className="p-4 bg-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-800 mr-3 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Secure Backups</p>
                      <p className="text-blue-700">
                        All backups are encrypted and stored securely. Your business data is protected.
                      </p>
                    </div>
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