'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary, { DefaultErrorFallback } from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Global error handler for the entire application
function GlobalErrorFallback({ error, errorInfo, errorId, resetError }: any) {
  React.useEffect(() => {
    // Report critical app-level errors
    logger.error('CRITICAL: App-level error boundary triggered', {
      errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo
    });
  }, [error, errorInfo, errorId]);

  return (
    <DefaultErrorFallback 
      error={error}
      errorInfo={errorInfo}
      errorId={errorId}
      resetError={resetError}
    />
  );
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
    <ErrorBoundary
      fallback={GlobalErrorFallback}
      onError={(error, errorInfo, errorId) => {
        // Custom error reporting for app-level errors
        logger.error('App-level error boundary triggered', {
          errorId,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          errorInfo: {
            componentStack: errorInfo.componentStack
          },
          severity: 'critical',
          context: {
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            timestamp: new Date().toISOString()
          }
        });

        // Report to external services in production
        if (process.env.NODE_ENV === 'production') {
          // Could integrate with Sentry, LogRocket, etc.
          console.error('Production error reported:', { errorId, error, errorInfo });
        }
      }}
    >
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
      
      {children}
    </ErrorBoundary>
  );
}