import { Metadata } from 'next';
import AdminReportingDashboard from '@/components/admin/AdminReportingDashboard';

export const metadata: Metadata = {
  title: 'Reports & Analytics - Fisher Backflows Admin',
  description: 'Comprehensive business reporting and analytics dashboard',
};

export default function AdminReportsPage() {
  return <AdminReportingDashboard />;
}