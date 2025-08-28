import { logger } from '../logger';
import { cache } from '../cache';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  NETWORK = 'network',
  PAYMENT = 'payment',
  FILE_UPLOAD = 'file_upload',
  NOTIFICATION = 'notification'
}

export interface ErrorContext {
  userId?: string;
  customerId?: string;
  appointmentId?: string;
  invoiceId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  timestamp: Date;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface AppError {
  id: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  isRetryable: boolean;
  shouldNotifyUser: boolean;
  userMessage?: string;
  originalError?: Error;
  correlationId?: string;
}

export interface ErrorHandlingOptions {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  isRetryable?: boolean;
  shouldNotifyUser?: boolean;
  userMessage?: string;
  context?: Partial<ErrorContext>;
  shouldAlert?: boolean;
  shouldLog?: boolean;
}

class ErrorManager {
  private errorHandlers = new Map<ErrorCategory, Array<(error: AppError) => Promise<void>>>();
  private errorMetrics = new Map<string, { count: number; lastOccurred: Date }>();
  private readonly maxErrorsPerMinute = 100;
  private readonly alertThresholds = {
    [ErrorSeverity.CRITICAL]: 1,
    [ErrorSeverity.HIGH]: 5,
    [ErrorSeverity.MEDIUM]: 20,
    [ErrorSeverity.LOW]: 50
  };

  async handleError(
    error: Error | string,
    options: ErrorHandlingOptions = {}
  ): Promise<AppError> {
    const appError = this.createAppError(error, options);
    
    // Check for error rate limiting
    if (await this.isRateLimited(appError.code)) {
      await logger.warn('Error rate limited', { errorCode: appError.code });
      return appError;
    }

    // Log the error
    if (options.shouldLog !== false) {
      await this.logError(appError);
    }

    // Update metrics
    await this.updateErrorMetrics(appError);

    // Execute category-specific handlers
    await this.executeErrorHandlers(appError);

    // Check if we should send alerts
    if (options.shouldAlert !== false) {
      await this.checkAndSendAlerts(appError);
    }

    // Store error for analysis
    await this.storeError(appError);

    return appError;
  }

  registerErrorHandler(
    category: ErrorCategory,
    handler: (error: AppError) => Promise<void>
  ): void {
    if (!this.errorHandlers.has(category)) {
      this.errorHandlers.set(category, []);
    }
    this.errorHandlers.get(category)!.push(handler);
  }

  private createAppError(
    error: Error | string,
    options: ErrorHandlingOptions
  ): AppError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const originalError = typeof error === 'string' ? undefined : error;

    return {
      id: this.generateErrorId(),
      code: this.generateErrorCode(errorMessage, options.category),
      message: errorMessage,
      severity: options.severity || this.determineSeverity(errorMessage),
      category: options.category || this.determineCategory(errorMessage),
      context: {
        ...options.context,
        timestamp: new Date(),
        stackTrace: originalError?.stack
      },
      isRetryable: options.isRetryable ?? this.isRetryableError(errorMessage),
      shouldNotifyUser: options.shouldNotifyUser ?? false,
      userMessage: options.userMessage || this.generateUserMessage(errorMessage),
      originalError,
      correlationId: this.generateCorrelationId()
    };
  }

  private async logError(error: AppError): Promise<void> {
    const logLevel = this.getLogLevel(error.severity);
    
    await logger[logLevel]('Application error occurred', {
      errorId: error.id,
      errorCode: error.code,
      message: error.message,
      severity: error.severity,
      category: error.category,
      isRetryable: error.isRetryable,
      context: error.context,
      correlationId: error.correlationId
    });
  }

  private async executeErrorHandlers(error: AppError): Promise<void> {
    const handlers = this.errorHandlers.get(error.category) || [];
    
    for (const handler of handlers) {
      try {
        await handler(error);
      } catch (handlerError) {
        await logger.error('Error handler failed', {
          errorId: error.id,
          handlerError: handlerError
        });
      }
    }
  }

  private async updateErrorMetrics(error: AppError): Promise<void> {
    const key = `error_metrics:${error.code}`;
    const current = this.errorMetrics.get(error.code) || { count: 0, lastOccurred: new Date() };
    
    current.count++;
    current.lastOccurred = new Date();
    
    this.errorMetrics.set(error.code, current);
    
    // Store in cache for persistence
    await cache.set(key, current, 3600); // 1 hour
  }

  private async checkAndSendAlerts(error: AppError): Promise<void> {
    const threshold = this.alertThresholds[error.severity];
    const metrics = this.errorMetrics.get(error.code);
    
    if (metrics && metrics.count >= threshold) {
      await this.sendAlert(error, metrics);
    }
  }

  private async sendAlert(error: AppError, metrics: { count: number; lastOccurred: Date }): Promise<void> {
    // This would integrate with your alerting system (email, Slack, PagerDuty, etc.)
    await logger.error('Error alert triggered', {
      errorId: error.id,
      errorCode: error.code,
      severity: error.severity,
      occurrenceCount: metrics.count,
      message: error.message,
      context: error.context
    });

    // Send to external alerting service
    try {
      // Example: Send to Slack, PagerDuty, etc.
      // await this.sendExternalAlert(error, metrics);
    } catch (alertError) {
      await logger.error('Failed to send external alert', { alertError });
    }
  }

  private async storeError(error: AppError): Promise<void> {
    try {
      const errorRecord = {
        id: error.id,
        code: error.code,
        message: error.message,
        severity: error.severity,
        category: error.category,
        context: JSON.stringify(error.context),
        is_retryable: error.isRetryable,
        correlation_id: error.correlationId,
        created_at: new Date().toISOString()
      };

      // Store in database for analysis
      await cache.set(`error:${error.id}`, errorRecord, 86400); // 24 hours
      
    } catch (storeError) {
      await logger.error('Failed to store error', { 
        errorId: error.id, 
        storeError 
      });
    }
  }

  private async isRateLimited(errorCode: string): Promise<boolean> {
    const rateLimitKey = `error_rate_limit:${errorCode}`;
    const currentMinute = Math.floor(Date.now() / 60000);
    const key = `${rateLimitKey}:${currentMinute}`;
    
    const count = await cache.get(key) || 0;
    
    if (count >= this.maxErrorsPerMinute) {
      return true;
    }
    
    await cache.set(key, count + 1, 60); // 1 minute TTL
    return false;
  }

  private determineSeverity(errorMessage: string): ErrorSeverity {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('critical') || 
        message.includes('fatal') ||
        message.includes('payment failed') ||
        message.includes('database unavailable')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (message.includes('failed to') ||
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('timeout')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('warning') ||
        message.includes('retry') ||
        message.includes('temporary')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private determineCategory(errorMessage: string): ErrorCategory {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (message.includes('unauthorized') || message.includes('login') || message.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    if (message.includes('database') || message.includes('query') || message.includes('connection')) {
      return ErrorCategory.DATABASE;
    }
    
    if (message.includes('payment') || message.includes('stripe') || message.includes('invoice')) {
      return ErrorCategory.PAYMENT;
    }
    
    if (message.includes('upload') || message.includes('file') || message.includes('storage')) {
      return ErrorCategory.FILE_UPLOAD;
    }
    
    if (message.includes('email') || message.includes('notification') || message.includes('sms')) {
      return ErrorCategory.NOTIFICATION;
    }
    
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    
    if (message.includes('api') || message.includes('service') || message.includes('external')) {
      return ErrorCategory.EXTERNAL_SERVICE;
    }
    
    return ErrorCategory.SYSTEM;
  }

  private isRetryableError(errorMessage: string): boolean {
    const retryablePatterns = [
      'timeout',
      'connection',
      'temporary',
      'rate limit',
      'service unavailable',
      'deadlock',
      'conflict'
    ];
    
    const message = errorMessage.toLowerCase();
    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  private generateUserMessage(errorMessage: string): string {
    const category = this.determineCategory(errorMessage);
    
    const userMessages = {
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
      [ErrorCategory.AUTHENTICATION]: 'Please log in and try again.',
      [ErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action.',
      [ErrorCategory.DATABASE]: 'We are experiencing technical difficulties. Please try again later.',
      [ErrorCategory.EXTERNAL_SERVICE]: 'An external service is temporarily unavailable. Please try again later.',
      [ErrorCategory.BUSINESS_LOGIC]: 'Unable to complete this action. Please contact support.',
      [ErrorCategory.SYSTEM]: 'We are experiencing technical difficulties. Please try again later.',
      [ErrorCategory.NETWORK]: 'Connection issue. Please check your internet connection and try again.',
      [ErrorCategory.PAYMENT]: 'Payment processing failed. Please try again or use a different payment method.',
      [ErrorCategory.FILE_UPLOAD]: 'File upload failed. Please try again with a valid file.',
      [ErrorCategory.NOTIFICATION]: 'Notification delivery failed. The action was completed successfully.'
    };
    
    return userMessages[category] || 'An unexpected error occurred. Please try again.';
  }

  private getLogLevel(severity: ErrorSeverity): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'debug';
      case ErrorSeverity.MEDIUM:
        return 'info';
      case ErrorSeverity.HIGH:
        return 'warn';
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'error';
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorCode(message: string, category?: ErrorCategory): string {
    const hash = this.simpleHash(message);
    const categoryPrefix = category ? category.toUpperCase().substr(0, 3) : 'GEN';
    return `${categoryPrefix}_${hash}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 6);
  }

  async getErrorMetrics(): Promise<Record<string, any>> {
    const metrics = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      topErrors: [] as Array<{ code: string; count: number; lastOccurred: Date }>
    };

    for (const [code, data] of this.errorMetrics.entries()) {
      metrics.totalErrors += data.count;
    }

    return metrics;
  }

  async clearOldErrors(): Promise<void> {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [code, data] of this.errorMetrics.entries()) {
      if (data.lastOccurred.getTime() < cutoffTime) {
        this.errorMetrics.delete(code);
        await cache.del(`error_metrics:${code}`);
      }
    }
  }
}

export const errorManager = new ErrorManager();

// Convenience functions
export const handleError = (
  error: Error | string,
  options?: ErrorHandlingOptions
): Promise<AppError> => {
  return errorManager.handleError(error, options);
};

export const registerErrorHandler = (
  category: ErrorCategory,
  handler: (error: AppError) => Promise<void>
): void => {
  errorManager.registerErrorHandler(category, handler);
};

// Global error handlers for different categories
registerErrorHandler(ErrorCategory.DATABASE, async (error) => {
  // Handle database errors - maybe trigger failover, alert DBAs, etc.
  await logger.error('Database error detected', { errorId: error.id });
});

registerErrorHandler(ErrorCategory.PAYMENT, async (error) => {
  // Handle payment errors - maybe retry, notify finance team, etc.
  await logger.error('Payment error detected', { errorId: error.id });
});

registerErrorHandler(ErrorCategory.AUTHENTICATION, async (error) => {
  // Handle auth errors - maybe clear sessions, notify security team, etc.
  await logger.warn('Authentication error detected', { errorId: error.id });
});