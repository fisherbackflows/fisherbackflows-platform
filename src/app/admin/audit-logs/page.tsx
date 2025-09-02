import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Metadata } from 'next';
import AuditLogViewer from '@/components/admin/AuditLogViewer';

export const metadata: Metadata = {
  title: 'Audit Logs - Fisher Backflows Admin',
  description: 'Security and compliance audit log monitoring',
};

export default function AuditLogsPage() {
  return <AuditLogViewer />

      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white">
              ← Admin Dashboard
            </Button>
          </Link>
        </div>
      </header>
;
}