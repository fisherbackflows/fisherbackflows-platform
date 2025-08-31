import { Metadata } from 'next';
import RouteOptimizer from '@/components/admin/RouteOptimizer';

export const metadata: Metadata = {
  title: 'Route Optimizer - Fisher Backflows Admin',
  description: 'AI-powered route optimization for maximum technician efficiency and fuel savings',
};

export default function RouteOptimizerPage() {
  return <RouteOptimizer />;
}