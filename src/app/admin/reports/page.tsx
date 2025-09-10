import { Metadata } from 'next';
import AdminReportingDashboard from '@/components/admin/AdminReportingDashboard';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';

export const metadata: Metadata = {
  title: 'Reports & Analytics - Fisher Backflows Admin',
  description: 'Comprehensive business reporting and analytics dashboard',
};

export default function AdminReportsPage() {
  return (
    <div className="min-h-screen bg-black">
      <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
      <AdminReportingDashboard />
    </div>
  );
}