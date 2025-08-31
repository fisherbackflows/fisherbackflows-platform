import { Metadata } from 'next';
import DataExportManager from '@/components/admin/DataExportManager';

export const metadata: Metadata = {
  title: 'Data Management - Fisher Backflows Admin',
  description: 'Export and import platform data',
};

export default function DataManagementPage() {
  return <DataExportManager />;
}