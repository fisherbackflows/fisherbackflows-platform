import { Metadata } from 'next';
import RouteOptimizer from '@/components/admin/RouteOptimizer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Route Optimizer - Fisher Backflows Admin',
  description: 'AI-powered route optimization for maximum technician efficiency and fuel savings',
};

export default function RouteOptimizerPage() {
  return <RouteOptimizer />
      {/* Navigation Bar */}
      <div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white" onClick={() => window.history.back()}>
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>;
}