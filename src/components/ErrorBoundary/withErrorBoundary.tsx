'use client';

import React from 'react';
import ErrorBoundary, { ErrorFallbackProps, ComponentErrorBoundary, AsyncErrorBoundary, FormErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';

// Higher-order component for adding error boundaries to any component
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ComponentType<ErrorFallbackProps>;
    isolate?: boolean;
    componentName?: string;
    onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  } = {}
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const componentName = options.componentName || Component.displayName || Component.name || 'UnknownComponent';
    
    const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
      logger.error(`Error in ${componentName}`, {
        componentName,
        errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        }
      });

      if (options.onError) {
        options.onError(error, errorInfo, errorId);
      }
    };

    return (
      <ErrorBoundary
        fallback={options.fallback}
        isolate={options.isolate}
        onError={handleError}
      >
        <Component {...props} ref={ref} />
      </ErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

// Specialized HOCs for different types of components
export function withAsyncErrorBoundary<P extends object>(Component: React.ComponentType<P>) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <AsyncErrorBoundary>
      <Component {...props} ref={ref} />
    </AsyncErrorBoundary>
  ));

  WrappedComponent.displayName = `withAsyncErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

export function withFormErrorBoundary<P extends object>(Component: React.ComponentType<P>) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <FormErrorBoundary>
      <Component {...props} ref={ref} />
    </FormErrorBoundary>
  ));

  WrappedComponent.displayName = `withFormErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

export function withComponentErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ComponentErrorBoundary componentName={componentName || Component.displayName || Component.name || 'Component'}>
      <Component {...props} ref={ref} />
    </ComponentErrorBoundary>
  ));

  WrappedComponent.displayName = `withComponentErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorBoundary() {
  const [, setState] = React.useState();

  return React.useCallback((error: Error) => {
    setState(() => {
      throw error;
    });
  }, []);
}

// Custom hook for graceful error handling in components
export function useErrorHandler() {
  const throwError = useErrorBoundary();

  return React.useCallback(
    async (
      asyncFn: () => Promise<unknown>,
      onError?: (error: Error) => void
    ): Promise<unknown> => {
      try {
        return await asyncFn();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        logger.error('Async operation failed', {
          error: {
            name: err.name,
            message: err.message,
            stack: err.stack
          }
        });

        if (onError) {
          onError(err);
        } else {
          // Throw to error boundary if no custom handler
          throwError(err);
        }
        
        return null;
      }
    },
    [throwError]
  );
}

// Component for displaying error states
export function ErrorDisplay({ 
  error, 
  title = 'Something went wrong',
  showDetails = false,
  onRetry,
  className = ''
}: {
  error: Error;
  title?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`p-6 bg-red-200 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-1 text-sm text-red-700">
            {error.message}
          </div>
          {showDetails && error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-red-800 hover:text-red-800">
                Technical Details
              </summary>
              <pre className="mt-1 text-xs text-red-800 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        {onRetry && (
          <div className="ml-3">
            <button
              type="button"
              onClick={onRetry}
              className="bg-red-300 text-red-800 hover:bg-red-200 px-3 py-1 text-sm font-medium rounded-md"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withErrorBoundary;