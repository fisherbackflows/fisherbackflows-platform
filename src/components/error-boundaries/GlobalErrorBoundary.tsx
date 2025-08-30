'use client';

import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Phone, Bug } from 'lucide-react';
import { auditLogger, AuditEventType } from '@/lib/audit-logger';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  resetError: () => void;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Global Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);

    // Log to audit system
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      await auditLogger.logEvent({
        eventType: AuditEventType.SYSTEM_ERROR,
        severity: 'critical',
        success: false,
        errorMessage: error.message,
        metadata: {
          errorId: this.state.errorId,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
          errorBoundary: 'GlobalErrorBoundary',
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        },
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to log error to audit system:', logError);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId!}
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, errorId, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const reportError = () => {
    // In production, this would send to error reporting service
    const subject = encodeURIComponent(`Error Report: ${errorId}`);
    const body = encodeURIComponent(`Error ID: ${errorId}\nError: ${error.message}\n\nPlease describe what you were doing when this error occurred:`);
    window.open(`mailto:support@fisherbackflows.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-grid opacity-5" />
      <div className="fixed inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-500/10" />
      
      <div className="max-w-2xl w-full relative z-10">
        <div className="glass-red rounded-3xl p-8 text-center">
          {/* Error Icon */}
          <div className="glass-red rounded-full p-6 mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Oops! Something went wrong
          </h1>
          
          <p className="text-red-100/80 mb-8 text-lg">
            We're sorry, but there was an unexpected error. Our team has been notified and we're working to fix it.
          </p>

          {/* Error ID */}
          <div className="glass-darker rounded-xl p-4 mb-8">
            <p className="text-white/70 text-sm mb-2">Error ID for support:</p>
            <code className="text-red-300 font-mono text-sm bg-black/20 px-3 py-1 rounded">
              {errorId}
            </code>
          </div>

          {/* Development Error Details */}
          {isDevelopment && (
            <div className="glass-darker rounded-xl p-4 mb-8 text-left">
              <h3 className="text-white font-medium mb-3 flex items-center">
                <Bug className="h-4 w-4 mr-2" />
                Development Details
              </h3>
              <div className="text-red-300 text-sm font-mono bg-black/30 p-3 rounded max-h-48 overflow-auto">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={resetError}
              className="btn-glow py-3 px-6 rounded-xl font-medium flex items-center justify-center space-x-2 hover-glow"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="bg-white/10 hover:bg-white/20 border border-white/20 py-3 px-6 rounded-xl font-medium text-white transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Go Home</span>
            </button>

            <button
              onClick={reportError}
              className="bg-white/5 hover:bg-white/10 border border-white/10 py-3 px-6 rounded-xl font-medium text-white/80 transition-colors flex items-center justify-center space-x-2"
            >
              <Phone className="h-5 w-5" />
              <span>Report Issue</span>
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm">
              Need immediate help? Call us at{' '}
              <a href="tel:2532788692" className="text-blue-400 hover:text-blue-300">
                (253) 278-8692
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalErrorBoundary;