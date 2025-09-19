'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackUrl?: string;
  showError?: boolean;
}

interface UserInfo {
  role: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function RoleGuard({
  children,
  allowedRoles,
  fallbackUrl = '/team-portal/dashboard',
  showError = true
}: RoleGuardProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/team/auth/me');

        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push('/team-portal/login');
          return;
        }

        const data = await response.json();
        setUserInfo(data.user);

        // Check if user role is in allowed roles
        const userRole = data.user.role || data.role;
        const hasPermission = allowedRoles.includes(userRole) || allowedRoles.includes('*');

        setHasAccess(hasPermission);

        if (!hasPermission && !showError) {
          // Silently redirect if showError is false
          router.push(fallbackUrl);
        }

      } catch (error) {
        console.error('Role check error:', error);
        router.push('/team-portal/login');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [allowedRoles, fallbackUrl, router, showError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" color="blue" />
          <p className="mt-4 text-white/80">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    if (!showError) {
      return null; // Component will redirect
    }

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="p-4 bg-red-500/20 border border-red-400 rounded-2xl mb-6 inline-block">
              <Shield className="h-16 w-16 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-white/80 mb-6">
              You don't have permission to access this page.
              {userInfo && (
                <span className="block mt-2 text-sm">
                  Your role: <span className="font-semibold text-blue-400">{userInfo.role}</span>
                </span>
              )}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push(fallbackUrl)}
              className="w-full glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>

            <Button
              onClick={() => router.back()}
              className="w-full glass hover:glass text-white/80 px-6 py-3 rounded-2xl font-medium"
            >
              Go Back
            </Button>
          </div>

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium text-sm">Need Access?</span>
            </div>
            <p className="text-blue-300/80 text-xs">
              Contact your administrator if you believe you should have access to this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}