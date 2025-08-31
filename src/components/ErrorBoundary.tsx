'use client';

import React from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  isolate?: boolean; // If true, error won't bubble up to parent boundaries
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  errorId: string;
  resetError: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error with context
    logger.error('React Error Boundary caught error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      errorId,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString()
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // Send error to monitoring service
    this.reportError(error, errorInfo, errorId);

    // Don't bubble up if isolate is true
    if (this.props.isolate) {
      return;
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    try {
      // Send to error reporting service (e.g., Sentry, Bugsnag, etc.)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            errorId,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            errorInfo: {
              componentStack: errorInfo.componentStack
            },
            context: {
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              sessionId: sessionStorage.getItem('sessionId') || 'unknown'
            }
          })
        }).catch(err => {
          console.error('Failed to report error to server:', err);
        });
      }
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
    }
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private resetWithDelay = () => {
    // Auto-reset after 10 seconds to prevent permanent broken states
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError();
    }, 10000);
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo && this.state.errorId) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
export function DefaultErrorFallback({ error, errorInfo, errorId, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  React.useEffect(() => {
    // Auto-refresh in production after 30 seconds if user doesn't take action
    const autoRefreshTimeout = setTimeout(() => {
      if (process.env.NODE_ENV === 'production') {
        window.location.reload();
      }
    }, 30000);

    return () => clearTimeout(autoRefreshTimeout);
  }, []);

  const handleReportIssue = () => {
    const subject = encodeURIComponent(`Bug Report - Error ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
Error: ${error.message}

Please describe what you were doing when this error occurred:
`);
    window.open(`mailto:support@fisherbackflows.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-red-900/20 to-black border border-red-500/30 rounded-2xl p-8 max-w-2xl w-full text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-red-300 text-lg">
            We're sorry, but an unexpected error occurred.
          </p>
        </div>

        <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-left">
          <p className="text-red-200 text-sm mb-2">
            Error ID: <code className="bg-red-800/30 px-2 py-1 rounded text-red-100">{errorId}</code>
          </p>
          {isDevelopment && (
            <details className="mt-4">
              <summary className="cursor-pointer text-red-300 hover:text-red-200">
                Technical Details (Development Mode)
              </summary>
              <div className="mt-2 p-2 bg-red-950/50 rounded text-xs">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-red-100 mt-1">{error.stack}</pre>
                  </div>
                )}
                {errorInfo.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap text-red-100 mt-1">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={resetError}
            className="bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
          
          <Button
            onClick={handleReportIssue}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Report Issue
          </Button>
        </div>

        <div className="mt-6 text-sm text-gray-800">
          <p>If this problem persists, please contact support at</p>
          <a 
            href="mailto:support@fisherbackflows.com" 
            className="text-blue-400 hover:text-blue-300"
          >
            support@fisherbackflows.com
          </a>
        </div>
      </div>
    </div>
  );
}

// Specialized error boundaries for different parts of the app
export function AsyncErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-6 bg-red-200 border-l-4 border-red-400 text-red-700">
          <h3 className="font-semibold">Failed to load content</h3>
          <p className="mt-1 text-sm">{error.message}</p>
          <Button onClick={resetError} className="mt-2 text-sm">
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      isolate
      fallback={({ error, resetError }) => (
        <div className="p-4 bg-red-200 border border-red-200 rounded-lg text-red-700">
          <p className="text-sm font-medium">Form Error</p>
          <p className="mt-1 text-sm">{error.message}</p>
          <Button onClick={resetError} size="sm" className="mt-2">
            Reset Form
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: React.ReactNode;
  componentName: string;
}) {
  return (
    <ErrorBoundary
      isolate
      fallback={({ resetError }) => (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          <p>The {componentName} component encountered an error.</p>
          <Button onClick={resetError} size="sm" className="mt-1">
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for error boundary functionality
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: { [key: string]: unknown }) => {
    logger.error('Manual error report', { error, errorInfo });
    
    // Re-throw to trigger error boundary
    throw error;
  }, []);
}

export default ErrorBoundary;