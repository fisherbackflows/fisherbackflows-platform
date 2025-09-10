import { Metadata } from 'next';
import DataExportManager from '@/components/admin/DataExportManager';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';

export const metadata: Metadata = {
  title: 'Data Management - Fisher Backflows Admin',
  description: 'Export and import platform data',
};

export default function DataManagementPage() {
  return (
    <div className="min-h-screen bg-black">
      <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
      <DataExportManager />
    </div>
  );
}