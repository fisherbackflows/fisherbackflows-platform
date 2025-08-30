'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import OnboardingWizard from './OnboardingWizard';
import { useOnboarding, shouldShowOnboarding } from '@/hooks/useOnboarding';

interface OnboardingProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export default function OnboardingProvider({ children, userId }: OnboardingProviderProps) {
  const pathname = usePathname();
  const { needsOnboarding, completeOnboarding, state, loading } = useOnboarding(userId);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Determine if we should show onboarding
    const shouldShow = needsOnboarding && 
                      shouldShowOnboarding(pathname) && 
                      !loading;
    
    setShowOnboarding(shouldShow);
  }, [needsOnboarding, pathname, loading]);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
    
    // Redirect to appropriate dashboard
    const redirectPath = state.userType === 'customer' ? '/portal/dashboard' : '/team-portal/dashboard';
    window.location.href = redirectPath;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <OnboardingWizard
        onComplete={handleOnboardingComplete}
        userType={state.userType}
      />
    );
  }

  // Show normal app
  return <>{children}</>;
}