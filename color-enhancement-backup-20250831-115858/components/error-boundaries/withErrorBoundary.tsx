'use client';

import React from 'react';
import { PageErrorBoundary } from './PageErrorBoundary';
import { reportError } from './utils';

interface WithErrorBoundaryOptions {
  fallbackComponent?: React.ComponentType<any>;
  pageName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDebugInfo?: boolean;
}

/**
 * Higher-order component that wraps a component with an error boundary
 */
function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const {
    pageName = WrappedComponent.displayName || WrappedComponent.name || 'Component',
    onError,
    showDebugInfo
  } = options;

  const WithErrorBoundaryComponent = React.forwardRef<any, P>((props, ref) => {
    const handleError = async (error: Error, errorInfo: React.ErrorInfo) => {
      // Report error
      await reportError({
        error,
        errorInfo,
        context: `Component: ${pageName}`,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      });

      // Call custom error handler if provided
      onError?.(error, errorInfo);
    };

    return (
      <PageErrorBoundary
        pageName={pageName}
        showDebugInfo={showDebugInfo}
      >
        <WrappedComponent {...props} ref={ref} />
      </PageErrorBoundary>
    );
  });

  // Set display name for debugging
  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${pageName})`;

  return WithErrorBoundaryComponent;
}

export default withErrorBoundary;