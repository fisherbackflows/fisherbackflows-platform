import { Metadata } from 'next';
import RouteOptimizer from '@/components/admin/RouteOptimizer';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';

export const metadata: Metadata = {
  title: 'Route Optimizer - Fisher Backflows Admin',
  description: 'AI-powered route optimization for maximum technician efficiency and fuel savings',
};

export default function RouteOptimizerPage() {
  return (
    <div className="min-h-screen bg-black">
      <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
      <RouteOptimizer />
    </div>
  );
}