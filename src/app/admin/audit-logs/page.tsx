import { Metadata } from 'next';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';

export const metadata: Metadata = {
  title: 'Audit Logs - Fisher Backflows Admin',
  description: 'Security and compliance audit log monitoring',
};

export default function AuditLogsPage() {
  return (
    <div className="min-h-screen bg-black">
      <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
      <AuditLogViewer />
    </div>
  );
}