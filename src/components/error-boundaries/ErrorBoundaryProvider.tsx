'use client';

import React from 'react';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import { reportError, logClientError } from './utils';

interface ErrorBoundaryProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that sets up global error handling for the entire app
 */
export default function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  React.useEffect(() => {
    // Set up global error handlers for unhandled errors
    const handleError = (event: ErrorEvent) => {
      logClientError(
        event.message,
        event.filename,
        event.lineno,
        event.colno,
        event.error
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      logClientError(
        `Unhandled Promise Rejection: ${error.message}`,
        undefined,
        undefined,
        undefined,
        error
      );
    };

    // Add global error listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleGlobalError = async (error: Error, errorInfo: React.ErrorInfo) => {
    await reportError({
      error,
      errorInfo,
      context: 'Global Error Boundary',
      timestamp: new Date()
    });
  };

  return (
    <GlobalErrorBoundary onError={handleGlobalError}>
      {children}
    </GlobalErrorBoundary>
  );
}