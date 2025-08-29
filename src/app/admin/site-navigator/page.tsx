'use client';

import React from 'react';
import { SiteNavigator } from '@/components/admin/SiteNavigator';
import { UnifiedLayout } from '@/components/ui/UnifiedLayout';
import { UnifiedHeader } from '@/components/ui';

export default function SiteNavigatorPage() {
  return (
    <UnifiedLayout variant="wide" background="gradient">
      <UnifiedHeader 
        title="Site Navigator"
        subtitle="Complete platform navigation and management - 82 pages"
        theme="purple"
      />
      <SiteNavigator />
    </UnifiedLayout>
  );
}