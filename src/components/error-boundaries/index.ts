/**
 * Fisher Backflows Error Boundary System
 * Comprehensive error handling for production stability
 */

export { GlobalErrorBoundary, type ErrorFallbackProps } from './GlobalErrorBoundary';
export { PageErrorBoundary } from './PageErrorBoundary';
export { AsyncErrorBoundary, type AsyncErrorFallbackProps } from './AsyncErrorBoundary';

// Error boundary wrapper components for common use cases
export { default as withErrorBoundary } from './withErrorBoundary';
export { default as ErrorBoundaryProvider } from './ErrorBoundaryProvider';

// Utility functions
export { reportError, logClientError } from './utils';