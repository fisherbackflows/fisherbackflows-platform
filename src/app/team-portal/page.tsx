'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function TeamPortalPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (response.ok) {
          const data = await response.json();
          // All authenticated users go to dashboard regardless of role
          router.push('/team-portal/dashboard');
        } else {
          // Not authenticated, redirect to login
          router.push('/team-portal/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, redirect to login
        router.push('/team-portal/login');
      }
    };

    checkAuth();
  }, [router]);

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" color="blue" />
        <p className="mt-4 text-white/80">Checking authentication...</p>
      </div>
    </div>
  );
}