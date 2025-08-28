import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { errorManager, ErrorCategory, ErrorSeverity, handleError } from './error-manager';
import { logger } from '../logger';

export interface ErrorMiddlewareOptions {
  enableDetailedErrors?: boolean;
  enableErrorReporting?: boolean;
  enableRateLimiting?: boolean;
  enableCors?: boolean;
}

export class ErrorMiddleware {
  private options: Required<ErrorMiddlewareOptions>;

  constructor(options: ErrorMiddlewareOptions = {}) {
    this.options = {
      enableDetailedErrors: process.env.NODE_ENV === 'development',
      enableErrorReporting: true,
      enableRateLimiting: true,
      enableCors: true,
      ...options
    };
  }

  async handleApiError(
    error: Error,
    request: NextRequest,
    context?: Record<string, any>
  ): Promise<NextResponse> {
    try {
      const errorContext = {
        endpoint: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: this.getClientIP(request),
        requestId: this.generateRequestId(),
        ...context
      };

      const appError = await handleError(error, {
        context: errorContext,
        shouldLog: this.options.enableErrorReporting,
        shouldAlert: true
      });

      return this.createErrorResponse(appError, request);

    } catch (middlewareError) {
      // Fallback error handling if our error handler fails
      await logger.error('Error middleware failed', {
        originalError: error.message,
        middlewareError: middlewareError
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  private createErrorResponse(
    appError: any,
    request: NextRequest
  ): NextResponse {
    const statusCode = this.getHttpStatusCode(appError);
    
    const responseBody = {
      error: true,
      message: appError.shouldNotifyUser ? appError.userMessage : 'An error occurred',
      code: appError.code,
      correlationId: appError.correlationId,
      timestamp: appError.context.timestamp,
      ...(this.options.enableDetailedErrors && {
        details: {
          severity: appError.severity,
          category: appError.category,
          isRetryable: appError.isRetryable,
          originalMessage: appError.message
        }
      })
    };

    const response = NextResponse.json(responseBody, { status: statusCode });

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Add CORS headers if enabled
    if (this.options.enableCors) {
      response.headers.set('Access-Control-Allow-Origin', this.getAllowedOrigin(request));
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Expose-Headers', 'X-Correlation-ID');
    }

    // Add correlation ID header
    response.headers.set('X-Correlation-ID', appError.correlationId);

    return response;
  }

  private getHttpStatusCode(appError: any): number {
    // Map application error categories to HTTP status codes
    const statusCodeMap = {
      [ErrorCategory.VALIDATION]: 400,
      [ErrorCategory.AUTHENTICATION]: 401,
      [ErrorCategory.AUTHORIZATION]: 403,
      [ErrorCategory.DATABASE]: 503,
      [ErrorCategory.EXTERNAL_SERVICE]: 502,
      [ErrorCategory.BUSINESS_LOGIC]: 422,
      [ErrorCategory.SYSTEM]: 500,
      [ErrorCategory.NETWORK]: 503,
      [ErrorCategory.PAYMENT]: 402,
      [ErrorCategory.FILE_UPLOAD]: 413,
      [ErrorCategory.NOTIFICATION]: 500
    };

    // Special cases based on error message
    const message = appError.message.toLowerCase();
    if (message.includes('not found')) return 404;
    if (message.includes('conflict')) return 409;
    if (message.includes('too many requests')) return 429;
    if (message.includes('payload too large')) return 413;
    if (message.includes('unsupported media type')) return 415;

    return statusCodeMap[appError.category] || 500;
  }

  private getClientIP(request: NextRequest): string {
    // Try various headers to get the real client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    return request.headers.get('x-real-ip') ||
           request.headers.get('x-client-ip') ||
           request.headers.get('cf-connecting-ip') ||
           request.ip ||
           'unknown';
  }

  private getAllowedOrigin(request: NextRequest): string {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['localhost:3000'];
    
    if (origin && allowedOrigins.some(allowed => origin.includes(allowed))) {
      return origin;
    }
    
    return allowedOrigins[0];
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global error middleware instance
export const errorMiddleware = new ErrorMiddleware();

// Wrapper function for API routes
export function withErrorHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>,
  options?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const response = await handler(request, context);
      
      // Convert Response to NextResponse if needed
      if (response instanceof Response && !(response instanceof NextResponse)) {
        const body = await response.text();
        return NextResponse.json(
          body ? JSON.parse(body) : null,
          { status: response.status }
        );
      }
      
      return response as NextResponse;

    } catch (error: any) {
      return await errorMiddleware.handleApiError(
        error,
        request,
        {
          ...options?.context,
          handlerCategory: options?.category,
          handlerSeverity: options?.severity
        }
      );
    }
  };
}

// React Error Boundary Component
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: any) => void;
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Handle the error with our error manager
    handleError(error, {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      },
      shouldNotifyUser: true,
      userMessage: 'Something went wrong. Please refresh the page and try again.'
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We've been notified of this error and are working to fix it.</p>
          <button onClick={this.resetError}>Try Again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  return {
    handleError: async (error: Error | string, options?: Parameters<typeof handleError>[1]) => {
      return await handleError(error, {
        category: ErrorCategory.SYSTEM,
        context: {
          component: 'useErrorHandler',
          timestamp: new Date()
        },
        ...options
      });
    },
    
    handleAsyncError: (asyncOperation: () => Promise<any>) => {
      return async (...args: any[]) => {
        try {
          return await asyncOperation.apply(this, args);
        } catch (error: any) {
          await handleError(error, {
            category: ErrorCategory.SYSTEM,
            context: {
              asyncOperation: true,
              timestamp: new Date()
            }
          });
          throw error; // Re-throw so calling code can handle it
        }
      };
    }
  };
}

// Validation error helper
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Business logic error helper  
export class BusinessLogicError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}