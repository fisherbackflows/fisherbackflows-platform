'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase';

interface AdminProtectionProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'technician' | 'team';
}

export default function AdminProtection({ 
  children, 
  requiredRole = 'admin' 
}: AdminProtectionProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  async function checkAuthentication() {
    try {
      // Check for session cookie
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('team_session='));
      
      if (!sessionCookie) {
        console.log('🔒 No session cookie found, redirecting to login');
        router.replace('/team-portal/login');
        return;
      }

      // Validate session with server
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('🔒 Session validation failed, redirecting to login');
        router.replace('/team-portal/login');
        return;
      }

      const { user, valid } = await response.json();

      if (!valid || !user) {
        console.log('🔒 Invalid session, redirecting to login');
        router.replace('/team-portal/login');
        return;
      }

      // Check role requirements
      if (requiredRole === 'admin' && user.role !== 'admin') {
        console.log('🔒 Insufficient permissions for admin access');
        router.replace('/team-portal/dashboard');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Authentication check failed:', error);
      router.replace('/team-portal/login');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full border-2 border-transparent border-t-current h-12 w-12 border-blue-600"></div>
            <p className="text-sm font-medium text-blue-800">
              Verifying authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-12 w-12 border-2 border-red-500 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-xl">!</span>
            </div>
            <p className="text-sm font-medium text-red-600">
              Access denied. Redirecting...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}