'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SiteNavigator } from '@/components/admin/SiteNavigator';
import { UnifiedLayout } from '@/components/ui/UnifiedLayout';
import { UnifiedHeader } from '@/components/ui';

export default function SiteNavigatorPage() {
  return (
    <UnifiedLayout variant="wide" background="gradient">
      <UnifiedHeader variant="admin">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white">
              ← Back to Dashboard
            </Button>
          </Link>
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