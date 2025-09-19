'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showReload?: boolean;
  showHomeLink?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to trigger error UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      try {
        // This would integrate with services like Sentry, LogRocket, etc.
        console.error('Production error:', error.message);
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="glass border border-red-400/50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
              <p className="text-white/80 mb-6 leading-relaxed">
                We encountered an unexpected error. This has been reported and we're working to fix it.
              </p>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-xl text-left">
                  <h3 className="text-red-300 font-medium mb-2">Development Error Details:</h3>
                  <pre className="text-red-200 text-xs overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              <div className="space-y-3">
                {/* Retry button */}
                <Button
                  onClick={this.handleReset}
                  className="w-full glass-btn-primary hover:glow-blue text-white font-semibold rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                {/* Reload button */}
                {this.props.showReload !== false && (
                  <Button
                    onClick={this.handleReload}
                    className="w-full glass border border-white/20 hover:border-white/40 text-white/80 font-semibold rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                )}

                {/* Home link */}
                {this.props.showHomeLink !== false && (
                  <Link href="/">
                    <Button className="w-full glass border border-blue-400/50 hover:border-blue-400 text-blue-300 font-semibold rounded-xl">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go Home
                    </Button>
                  </Link>
                )}
              </div>

              {/* Contact support */}
              <div className="mt-6 text-white/60 text-sm">
                <p>Need help? Contact support at</p>
                <a
                  href="mailto:support@fisherbackflows.com"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  support@fisherbackflows.com
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Specific error boundary for forms
export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Form error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-400/50 rounded-xl">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-red-300 font-medium">Form Error</h3>
          </div>
          <p className="text-red-200 text-sm mb-3">
            There was an error with this form. Please try refreshing the page.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            size="sm"
            className="glass border border-red-400/50 text-red-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Form
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;