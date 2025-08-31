import { Metadata } from 'next';
import AuditLogViewer from '@/components/admin/AuditLogViewer';

export const metadata: Metadata = {
  title: 'Audit Logs - Fisher Backflows Admin',
  description: 'Security and compliance audit log monitoring',
};

export default function AuditLogsPage() {
  return <AuditLogViewer />;
}