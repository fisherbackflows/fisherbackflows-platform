'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerPortalPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to company directory
    router.replace('/portal/directory');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
        <p className="mt-4 text-white/80">Redirecting to company directory...</p>
      </div>
    </div>
  );
}