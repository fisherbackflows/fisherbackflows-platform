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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto glow-blue"></div>
        <p className="mt-4 text-white/80">Redirecting to company directory...</p>
      </div>
    </div>
  );
}