'use client';

import { useState } from 'react';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
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
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center space-x-4">
            <Link href="/app/more">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white/80">Backup & Restore</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Backup */}
            <div className="glass rounded-2xl glow-blue-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    <Database className="h-5 w-5 inline mr-2" />
                    Create Manual Backup
                  </h2>
                  <p className="text-white/80">
                    Create a backup of all your business data including customers, test reports, and invoices.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  className="glass-btn-primary hover:glow-blue"
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

                <div className="text-sm text-white/80">
                  Last backup: Today at 2:00 AM (Automatic)
                </div>
              </div>

              {backupResult && (
                <div className={`mt-4 p-4 rounded-2xl ${
                  backupResult.success ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200' : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl border border-red-200'
                }`}>
                  <div className="flex items-start">
                    {backupResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-300 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-300 mr-3 mt-0.5" />
                    )}
                    <p className={`text-sm ${
                      backupResult.success ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {backupResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Backup History */}
            <div className="glass rounded-2xl glow-blue-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                <Clock className="h-5 w-5 inline mr-2" />
                Backup History
              </h2>

              <div className="space-y-4">
                {recentBackups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border border-blue-500/50 rounded-2xl">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-2xl ${
                        backup.status === 'complete' ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm' : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm'
                      }`}>
                        {backup.status === 'complete' ? (
                          <CheckCircle className="h-5 w-5 text-green-300" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-300" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-white/80">{backup.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-white/80 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {backup.date}
                          </span>
                          <span className="flex items-center">
                            <HardDrive className="h-4 w-4 mr-1" />
                            {backup.size}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            backup.type === 'auto' ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm text-blue-700' : 'glass text-white/90'
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
            <div className="glass rounded-2xl glow-blue-sm p-6 sticky top-8 space-y-6">
              <div>
                <h3 className="font-semibold text-white/80 mb-3">Backup Schedule</h3>
                <div className="space-y-2 text-sm text-white/80">
                  <div className="flex justify-between">
                    <span>Daily backups:</span>
                    <span className="text-green-300 font-medium">Enabled</span>
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
                <h3 className="font-semibold text-white/80 mb-3">What's Included</h3>
                <ul className="space-y-2 text-sm text-white/80">
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
                <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-300 mr-3 mt-0.5" />
                    <div className="text-sm text-blue-300">
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