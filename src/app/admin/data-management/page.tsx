import { Metadata } from 'next';
import DataExportManager from '@/components/admin/DataExportManager';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Data Management - Fisher Backflows Admin',
  description: 'Export and import platform data',
};

export default function DataManagementPage() {
  return (
    <>
      {/* Navigation Bar */}
      <div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
      <DataExportManager />
    </>
  );
}