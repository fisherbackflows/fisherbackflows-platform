'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new team portal dashboard
    router.replace('/team-portal/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting to Tester Portal...</p>
      </div>
    </div>
  );
}