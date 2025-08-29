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