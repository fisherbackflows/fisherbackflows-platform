'use client';

import React, { Component, ErrorInfo } from 'react';
import { Wifi, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<AsyncErrorFallbackProps>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isNetworkError: boolean;
  isRetrying: boolean;
}

export interface AsyncErrorFallbackProps {
  error: Error;
  isNetworkError: boolean;
  retry: () => void;
  isRetrying: boolean;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isNetworkError: false,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Detect network/API related errors
    const isNetworkError = 
      error.name === 'NetworkError' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('ERR_NETWORK') ||
      error.message.includes('ERR_INTERNET_DISCONNECTED');

    return {
      hasError: true,
      error,
      isNetworkError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🌐 Async Error Boundary caught an error:', error);
    
    // Log async/network errors with specific context
    if (this.state.isNetworkError) {
      console.error('🔌 Network/API Error Details:', {
        error: error.message,
        stack: error.stack,
        online: navigator.onLine,
        userAgent: navigator.userAgent
      });
    }
  }

  retry = async () => {
    this.setState({ isRetrying: true });
    
    // Add a small delay for better UX
    const timeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        isNetworkError: false,
        isRetrying: false
      });
    }, 1000);

    this.retryTimeouts.push(timeoutId);
  };

  componentWillUnmount() {
    // Clean up timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            isNetworkError={this.state.isNetworkError}
            retry={this.retry}
            isRetrying={this.state.isRetrying}
          />
        );
      }

      // Default async error fallback
      return (
        <DefaultAsyncErrorFallback
          error={this.state.error}
          isNetworkError={this.state.isNetworkError}
          retry={this.retry}
          isRetrying={this.state.isRetrying}
        />
      );
    }

    return this.props.children;
  }
}

// Default async error fallback component
function DefaultAsyncErrorFallback({ error, isNetworkError, retry, isRetrying }: AsyncErrorFallbackProps) {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className={`glass-${isNetworkError ? 'orange' : 'red'} rounded-2xl p-6`}>
          {/* Icon */}
          <div className={`glass-${isNetworkError ? 'orange' : 'red'} rounded-full p-3 mx-auto mb-4 w-12 h-12 flex items-center justify-center`}>
            {isNetworkError ? (
              <Wifi className={`h-6 w-6 text-${isNetworkError ? 'orange' : 'red'}-400`} />
            ) : (
              <AlertCircle className={`h-6 w-6 text-${isNetworkError ? 'orange' : 'red'}-400`} />
            )}
          </div>

          {/* Title & Message */}
          <h3 className="text-lg font-semibold text-white mb-2">
            {isNetworkError ? 'Connection Problem' : 'Loading Failed'}
          </h3>
          
          <p className="text-white/70 text-sm mb-4">
            {isNetworkError ? (
              isOnline ? 
                'Unable to connect to our servers. Please check your internet connection.' :
                'You appear to be offline. Please check your internet connection.'
            ) : (
              'Something went wrong while loading this content.'
            )}
          </p>

          {/* Error Message (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="glass-darker rounded-lg p-3 mb-4 text-left">
              <p className="text-xs text-white/60 mb-1">Error Details:</p>
              <code className="text-xs text-red-300 font-mono break-all">
                {error.message}
              </code>
            </div>
          )}

          {/* Retry Button */}
          <button
            onClick={retry}
            disabled={isRetrying}
            className={`btn-${isNetworkError ? 'orange' : 'red'} py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 mx-auto hover-glow disabled:opacity-50`}
          >
            {isRetrying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </>
            )}
          </button>

          {/* Network Status */}
          {isNetworkError && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-xs text-white/50">
                Network Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AsyncErrorBoundary;