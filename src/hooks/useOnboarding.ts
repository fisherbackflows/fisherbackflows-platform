/**
 * Onboarding Hook
 * Manages onboarding state and progress for new users
 */

'use client';

import { useState, useEffect } from 'react';

export interface OnboardingState {
  isComplete: boolean;
  currentStep: number;
  completedSteps: string[];
  lastUpdated: string;
  userType: 'customer' | 'team';
}

export interface OnboardingProgress {
  profileComplete: boolean;
  propertyAdded: boolean;
  paymentSetup: boolean;
  firstTestScheduled: boolean;
  notificationsConfigured: boolean;
}

export function useOnboarding(userId?: string) {
  const [state, setState] = useState<OnboardingState>({
    isComplete: false,
    currentStep: 0,
    completedSteps: [],
    lastUpdated: new Date().toISOString(),
    userType: 'customer'
  });

  const [progress, setProgress] = useState<OnboardingProgress>({
    profileComplete: false,
    propertyAdded: false,
    paymentSetup: false,
    firstTestScheduled: false,
    notificationsConfigured: false
  });

  const [loading, setLoading] = useState(true);

  // Load onboarding state from localStorage or API
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        setLoading(true);
        
        // Try to load from localStorage first (for demo/offline mode)
        const localState = localStorage.getItem(`onboarding_${userId || 'demo'}`);
        
        if (localState) {
          const parsedState = JSON.parse(localState);
          setState(parsedState);
          
          // Calculate progress from completed steps
          const newProgress: OnboardingProgress = {
            profileComplete: parsedState.completedSteps.includes('profile'),
            propertyAdded: parsedState.completedSteps.includes('property'),
            paymentSetup: parsedState.completedSteps.includes('payment'),
            firstTestScheduled: parsedState.completedSteps.includes('schedule'),
            notificationsConfigured: parsedState.completedSteps.includes('notifications')
          };
          setProgress(newProgress);
        } else {
          // For new users, check if they need onboarding
          const needsOnboarding = await checkIfUserNeedsOnboarding(userId);
          if (needsOnboarding) {
            // Initialize default state
            const defaultState: OnboardingState = {
              isComplete: false,
              currentStep: 0,
              completedSteps: [],
              lastUpdated: new Date().toISOString(),
              userType: detectUserType()
            };
            setState(defaultState);
            saveOnboardingState(defaultState);
          } else {
            // User doesn't need onboarding (existing user)
            setState(prev => ({ ...prev, isComplete: true }));
          }
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, [userId]);

  // Save state to localStorage and optionally to server
  const saveOnboardingState = async (newState: OnboardingState) => {
    try {
      // Save to localStorage
      localStorage.setItem(`onboarding_${userId || 'demo'}`, JSON.stringify(newState));
      
      // TODO: Save to server/database if user is authenticated
      if (userId && userId !== 'demo') {
        await saveToServer(newState);
      }
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  // Complete a step
  const completeStep = async (stepId: string) => {
    const newCompletedSteps = [...state.completedSteps];
    if (!newCompletedSteps.includes(stepId)) {
      newCompletedSteps.push(stepId);
    }

    const newState: OnboardingState = {
      ...state,
      completedSteps: newCompletedSteps,
      lastUpdated: new Date().toISOString()
    };

    setState(newState);
    await saveOnboardingState(newState);

    // Update progress
    const newProgress: OnboardingProgress = {
      profileComplete: newCompletedSteps.includes('profile'),
      propertyAdded: newCompletedSteps.includes('property'),
      paymentSetup: newCompletedSteps.includes('payment'),
      firstTestScheduled: newCompletedSteps.includes('schedule'),
      notificationsConfigured: newCompletedSteps.includes('notifications')
    };
    setProgress(newProgress);
  };

  // Complete onboarding entirely
  const completeOnboarding = async () => {
    const newState: OnboardingState = {
      ...state,
      isComplete: true,
      lastUpdated: new Date().toISOString()
    };

    setState(newState);
    await saveOnboardingState(newState);

    // Track completion event
    trackOnboardingCompletion();
  };

  // Reset onboarding (for testing or re-onboarding)
  const resetOnboarding = async () => {
    const defaultState: OnboardingState = {
      isComplete: false,
      currentStep: 0,
      completedSteps: [],
      lastUpdated: new Date().toISOString(),
      userType: state.userType
    };

    setState(defaultState);
    setProgress({
      profileComplete: false,
      propertyAdded: false,
      paymentSetup: false,
      firstTestScheduled: false,
      notificationsConfigured: false
    });

    // Remove from localStorage
    localStorage.removeItem(`onboarding_${userId || 'demo'}`);
  };

  // Set current step
  const setCurrentStep = (step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  // Check if user needs onboarding
  const checkIfUserNeedsOnboarding = async (userId?: string): Promise<boolean> => {
    // For demo users, always show onboarding
    if (!userId || userId === 'demo') {
      return true;
    }

    try {
      // Check if user has completed basic profile setup
      const response = await fetch(`/api/customers/${userId}`);
      if (response.ok) {
        const customer = await response.json();
        
        // If customer has devices and has made payments, skip onboarding
        if (customer.devices?.length > 0 && customer.balance === 0) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return true; // Default to showing onboarding on error
    }
  };

  // Detect user type from current route or user data
  const detectUserType = (): 'customer' | 'team' => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/team-portal') || path.includes('/app')) {
        return 'team';
      }
    }
    return 'customer';
  };

  // Save to server
  const saveToServer = async (state: OnboardingState) => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          onboardingState: state
        })
      });
    } catch (error) {
      console.error('Error saving onboarding to server:', error);
    }
  };

  // Analytics tracking
  const trackOnboardingCompletion = () => {
    try {
      // Track completion event for analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_complete', {
          user_type: state.userType,
          steps_completed: state.completedSteps.length,
          time_to_complete: Date.now() - new Date(state.lastUpdated).getTime()
        });
      }
    } catch (error) {
      console.error('Error tracking onboarding completion:', error);
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = (): number => {
    const totalSteps = state.userType === 'customer' ? 6 : 3;
    return Math.round((state.completedSteps.length / totalSteps) * 100);
  };

  // Get next recommended step
  const getNextStep = (): string | null => {
    const customerSteps = ['welcome', 'profile', 'property', 'schedule', 'payment', 'notifications'];
    const teamSteps = ['welcome', 'profile', 'tools'];
    const steps = state.userType === 'customer' ? customerSteps : teamSteps;
    
    return steps.find(step => !state.completedSteps.includes(step)) || null;
  };

  // Check if specific feature should show onboarding hints
  const shouldShowHint = (feature: string): boolean => {
    if (state.isComplete) return false;
    
    const hints: Record<string, string[]> = {
      'scheduling': ['schedule', 'property'],
      'payments': ['payment'],
      'profile': ['profile'],
      'notifications': ['notifications']
    };
    
    const requiredSteps = hints[feature] || [];
    return requiredSteps.some(step => !state.completedSteps.includes(step));
  };

  return {
    // State
    state,
    progress,
    loading,
    
    // Actions
    completeStep,
    completeOnboarding,
    resetOnboarding,
    setCurrentStep,
    
    // Utilities
    getCompletionPercentage,
    getNextStep,
    shouldShowHint,
    
    // Computed values
    isComplete: state.isComplete,
    needsOnboarding: !state.isComplete && !loading
  };
}

// Global onboarding state management
export const onboardingSteps = {
  customer: [
    { id: 'welcome', title: 'Welcome', required: false },
    { id: 'profile', title: 'Complete Profile', required: true },
    { id: 'property', title: 'Add Property', required: true },
    { id: 'schedule', title: 'Schedule Test', required: false },
    { id: 'payment', title: 'Payment Method', required: false },
    { id: 'notifications', title: 'Notifications', required: false }
  ],
  team: [
    { id: 'welcome', title: 'Welcome', required: false },
    { id: 'profile', title: 'Setup Profile', required: true },
    { id: 'tools', title: 'Platform Tour', required: false }
  ]
};

// Helper to check if onboarding should be shown app-wide
export function shouldShowOnboarding(pathname: string): boolean {
  // Don't show on login/auth pages
  if (pathname.includes('/login') || pathname.includes('/register')) {
    return false;
  }
  
  // Don't show on public pages
  if (pathname === '/' || pathname.includes('/maintenance')) {
    return false;
  }
  
  return true;
}