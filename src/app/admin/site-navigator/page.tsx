'use client';

import React from 'react';
import { SiteNavigator } from '@/components/admin/SiteNavigator';
import { UnifiedLayout } from '@/components/ui/UnifiedLayout';
import { UnifiedHeader } from '@/components/ui';

export default function SiteNavigatorPage() {
  return (
    <UnifiedLayout variant="wide" background="gradient">
      <UnifiedHeader variant="admin">
        <div className="flex items-center justify-between">
      {/* Navigation Bar */}
      <div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white" onClick={() => window.history.back()}>
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Site Navigator</h1>
            <p className="text-purple-300">Complete platform navigation and management - 82 pages</p>
          </div>
        </div>
      </UnifiedHeader>
      <SiteNavigator />
    </UnifiedLayout>
  );
}