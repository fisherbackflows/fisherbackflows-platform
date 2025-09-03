'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { GlobalErrorBoundary } from '@/components/error-boundaries';
import { logger } from '@/lib/logger';
import { reportError } from '@/components/error-boundaries/utils';
import PWAProvider from '@/components/pwa/PWAProvider';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PWAUpdatePrompt from '@/components/pwa/PWAUpdatePrompt';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Enhanced global error handler
async function handleGlobalError(error: Error, errorInfo: React.ErrorInfo) {
  // Log to existing logger system
  logger.error('CRITICAL: App-level error boundary triggered', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    errorInfo: {
      componentStack: errorInfo.componentStack
    },
    context: {
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString()
    }
  });

  // Report using new error boundary system
  await reportError({
    error,
    errorInfo,
    context: 'Global App Error',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: new Date()
  });
}

export default function AppProviders({ children }: AppProvidersProps) {
  React.useEffect(() => {
    // Global error handlers for unhandled errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', {
        error: event.reason,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      
      // Prevent default browser behavior
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      logger.error('Unhandled JavaScript error', {
        error: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        },
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    };

    // Add global error listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <GlobalErrorBoundary onError={handleGlobalError}>
      <PWAProvider>
        {/* Toast notifications for user feedback */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f9fafb'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f9fafb'
              }
            }
          }}
        />
        
        {/* PWA Features */}
        <PWAInstallPrompt />
        <PWAUpdatePrompt />
        
        {children}
      </PWAProvider>
    </GlobalErrorBoundary>
  );
}