'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase';

interface BusinessLayoutProps {
  children: React.ReactNode;
}

export default function BusinessLayout({ children }: BusinessLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClientComponentClient();

    // Check authentication and user role
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Check if user has business/team access
        // This will be enhanced with proper role checking from database
        const userEmail = user.email?.toLowerCase();
        const isBusinessUser = userEmail?.includes('@fisherbackflows') ||
                              userEmail?.includes('team') ||
                              userEmail?.includes('admin');

        if (!isBusinessUser) {
          router.push('/portal/dashboard');
          return;
        }

        setUserRole('business');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Checking business access...</p>
        </div>
      </div>
    );
  }

  // Render business portal if authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <main>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium text-white/80">Redirecting...</p>
      </div>
    </div>
  );
}