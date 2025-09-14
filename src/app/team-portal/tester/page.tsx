'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TesterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // This page exists only to catch redirects to the old tester page
    // Immediately redirect to the dashboard
    router.replace('/team-portal/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-white/80">Redirecting...</p>
      </div>
    </div>
  );
}