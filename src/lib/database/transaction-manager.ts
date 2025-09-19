import { supabase } from '../supabase';
import { logger } from '../logger';
import { cache } from '../cache';

export interface TransactionContext {
  id: string;
  startTime: Date;
  operations: Array<{
    table: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    recordId?: string;
    data?: any;
  }>;
  rollbackHandlers: Array<() => Promise<void>>;
}

export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionId?: string;
  duration?: number;
}

class DatabaseTransactionManager {
  private activeTransactions = new Map<string, TransactionContext>();
  private readonly maxTransactionTime = 30000; // 30 seconds
  private readonly retryAttempts = 3;
  private readonly retryDelayMs = 1000;

  async executeTransaction<T>(
    transactionFn: (context: TransactionContext) => Promise<T>,
    options: {
      isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
      timeout?: number;
      retryOnConflict?: boolean;
    } = {}
  ): Promise<TransactionResult<T>> {
    const transactionId = this.generateTransactionId();
    const context: TransactionContext = {
      id: transactionId,
      startTime: new Date(),
      operations: [],
      rollbackHandlers: []
    };

    this.activeTransactions.set(transactionId, context);

    let attempt = 0;
    const maxAttempts = options.retryOnConflict ? this.retryAttempts : 1;

    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        // Set timeout for transaction
        const timeout = options.timeout || this.maxTransactionTime;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout')), timeout)
        );

        // Execute transaction with timeout
        const result = await Promise.race([
          this.executeTransactionInternal(transactionFn, context, options),
          timeoutPromise
        ]) as T;

        const duration = Date.now() - context.startTime.getTime();
        
        await logger.info('Transaction completed successfully', {
          transactionId,
          duration,
          operationCount: context.operations.length,
          attempt
        });

        this.activeTransactions.delete(transactionId);
        
        return {
          success: true,
          data: result,
          transactionId,
          duration
        };

      } catch (error: any) {
        await logger.error('Transaction failed', {
          transactionId,
          attempt,
          error: error.message,
          operationCount: context.operations.length
        });

        // Check if this is a retryable error
        const isRetryable = this.isRetryableError(error);
        const shouldRetry = options.retryOnConflict && isRetryable && attempt < maxAttempts;

        if (!shouldRetry) {
          // Execute rollback handlers
          await this.executeRollback(context);
          this.activeTransactions.delete(transactionId);
          
          return {
            success: false,
            error: this.sanitizeError(error.message),
            transactionId
          };
        }

        // Wait before retry
        await this.delay(this.retryDelayMs * attempt);
        
        // Reset context for retry
        context.operations = [];
        context.rollbackHandlers = [];
        context.startTime = new Date();
      }
    }

    return {
      success: false,
      error: 'Transaction failed after maximum retry attempts',
      transactionId
    };
  }

  private async executeTransactionInternal<T>(
    transactionFn: (context: TransactionContext) => Promise<T>,
    context: TransactionContext,
    options: any
  ): Promise<T> {
    // Start database transaction
    const { data: transaction, error: txError } = await supabase.rpc('begin_transaction');
    
    if (txError) {
      throw new Error(`Failed to begin transaction: ${txError.message}`);
    }

    try {
      // Set isolation level if specified
      if (options.isolationLevel) {
        await supabase.rpc('set_transaction_isolation', { 
          level: options.isolationLevel 
        });
      }

      // Execute the transaction function
      const result = await transactionFn(context);

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      
      if (commitError) {
        throw new Error(`Failed to commit transaction: ${commitError.message}`);
      }

      return result;

    } catch (error) {
      // Rollback transaction
      await supabase.rpc('rollback_transaction').catch(rollbackError => {
        logger.error('Failed to rollback transaction', {
          transactionId: context.id,
          originalError: error,
          rollbackError: rollbackError.message
        });
      });
      
      throw error;
    }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delayMs?: number;
      backoffMultiplier?: number;
      retryCondition?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = this.retryAttempts,
      delayMs = this.retryDelayMs,
      backoffMultiplier = 1.5,
      retryCondition = this.isRetryableError
    } = options;

    let lastError: any;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts || !retryCondition(error)) {
          throw error;
        }

        await logger.warn('Operation failed, retrying', {
          attempt,
          maxAttempts,
          error: error.message,
          nextRetryIn: currentDelay
        });

        await this.delay(currentDelay);
        currentDelay *= backoffMultiplier;
      }
    }

    throw lastError;
  }

  async executeWithCircuitBreaker<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      failureThreshold?: number;
      recoveryTimeout?: number;
      monitoringWindow?: number;
    } = {}
  ): Promise<T> {
    const {
      failureThreshold = 5,
      recoveryTimeout = 60000, // 1 minute
      monitoringWindow = 300000 // 5 minutes
    } = options;

    const cacheKey = `circuit_breaker:${operationName}`;
    const state = await cache.get(cacheKey) || {
      failures: 0,
      lastFailure: null,
      state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    };

    // Check if circuit breaker is OPEN
    if (state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - new Date(state.lastFailure).getTime();
      
      if (timeSinceLastFailure < recoveryTimeout) {
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      } else {
        // Move to HALF_OPEN state
        state.state = 'HALF_OPEN';
        await cache.set(cacheKey, state, Math.floor(recoveryTimeout / 1000));
      }
    }

    try {
      const result = await operation();
      
      // Success - reset circuit breaker or close it
      if (state.state === 'HALF_OPEN') {
        state.state = 'CLOSED';
        state.failures = 0;
        await cache.set(cacheKey, state, Math.floor(monitoringWindow / 1000));
      }

      return result;

    } catch (error) {
      // Failure - increment counter
      state.failures++;
      state.lastFailure = new Date().toISOString();

      // Check if we should open the circuit breaker
      if (state.failures >= failureThreshold) {
        state.state = 'OPEN';
        await logger.error(`Circuit breaker opened for ${operationName}`, {
          failures: state.failures,
          threshold: failureThreshold
        });
      }

      await cache.set(cacheKey, state, Math.floor(monitoringWindow / 1000));
      throw error;
    }
  }

  private async executeRollback(context: TransactionContext): Promise<void> {
    for (const handler of context.rollbackHandlers.reverse()) {
      try {
        await handler();
      } catch (rollbackError) {
        await logger.error('Rollback handler failed', {
          transactionId: context.id,
          error: rollbackError
        });
      }
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'connection_failure',
      'timeout',
      'temporary_failure',
      'conflict',
      'deadlock',
      'serialization_failure'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  }

  private sanitizeError(errorMessage: string): string {
    // Remove sensitive information from error messages
    return errorMessage
      .replace(/password[=:]\s*[^\s,}]*/gi, 'password=***')
      .replace(/token[=:]\s*[^\s,}]*/gi, 'token=***')
      .replace(/key[=:]\s*[^\s,}]*/gi, 'key=***')
      .replace(/secret[=:]\s*[^\s,}]*/gi, 'secret=***');
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getActiveTransactions(): Promise<TransactionContext[]> {
    return Array.from(this.activeTransactions.values());
  }

  async forceRollbackTransaction(transactionId: string): Promise<boolean> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      return false;
    }

    try {
      await this.executeRollback(context);
      this.activeTransactions.delete(transactionId);
      return true;
    } catch (error) {
      await logger.error('Force rollback failed', {
        transactionId,
        error
      });
      return false;
    }
  }
}

export const transactionManager = new DatabaseTransactionManager();

export const withTransaction = async <T>(
  operation: (context: TransactionContext) => Promise<T>,
  options?: Parameters<DatabaseTransactionManager['executeTransaction']>[1]
): Promise<TransactionResult<T>> => {
  return transactionManager.executeTransaction(operation, options);
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options?: Parameters<DatabaseTransactionManager['executeWithRetry']>[1]
): Promise<T> => {
  return transactionManager.executeWithRetry(operation, options);
};

export const withCircuitBreaker = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  options?: Parameters<DatabaseTransactionManager['executeWithCircuitBreaker']>[2]
): Promise<T> => {
  return transactionManager.executeWithCircuitBreaker(operationName, operation, options);
};