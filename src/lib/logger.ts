// Enterprise-grade logging system for Fisher Backflows
import { createClientComponentClient } from '@/lib/supabase'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogEntry {
  id?: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error | string
  userId?: string
  sessionId?: string
  userAgent?: string
  ipAddress?: string
  timestamp: string
  source: string
  category: string
  metadata?: Record<string, any>
}

export interface LoggerConfig {
  enableConsole: boolean
  enableDatabase: boolean
  enableRemote: boolean
  minLevel: LogLevel
  maxRetries: number
  batchSize: number
  flushInterval: number
}

class Logger {
  private config: LoggerConfig
  private _supabase: ReturnType<typeof createClientComponentClient> | null = null
  private logQueue: LogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private retryCount = 0

  private get supabase() {
    if (!this._supabase) {
      try {
        this._supabase = createClientComponentClient()
      } catch (error) {
        console.warn('Supabase client could not be initialized:', error)
        return null
      }
    }
    return this._supabase
  }

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enableConsole: process.env.NODE_ENV === 'development',
      enableDatabase: true,
      enableRemote: process.env.NODE_ENV === 'production',
      minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      maxRetries: 3,
      batchSize: 50,
      flushInterval: 10000, // 10 seconds
      ...config
    }

    // Start periodic flush
    this.startPeriodicFlush()
  }

  // Main logging method
  async log(entry: Omit<LogEntry, 'timestamp' | 'id'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      userId: await this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      userAgent: this.getUserAgent(),
      ipAddress: await this.getIPAddress()
    }

    // Check if we should log this level
    if (!this.shouldLog(logEntry.level)) {
      return
    }

    // Console logging (development)
    if (this.config.enableConsole) {
      this.logToConsole(logEntry)
    }

    // Add to queue for batch processing
    this.logQueue.push(logEntry)

    // Immediate flush for critical errors
    if (logEntry.level === 'critical' || logEntry.level === 'error') {
      await this.flushLogs()
    }

    // Flush if queue is full
    if (this.logQueue.length >= this.config.batchSize) {
      await this.flushLogs()
    }
  }

  // Convenience methods
  async debug(message: string, context?: Record<string, any>, source = 'app'): Promise<void> {
    await this.log({ level: 'debug', message, context, source, category: 'debug' })
  }

  async info(message: string, context?: Record<string, any>, source = 'app'): Promise<void> {
    await this.log({ level: 'info', message, context, source, category: 'info' })
  }

  async warn(message: string, context?: Record<string, any>, source = 'app'): Promise<void> {
    await this.log({ level: 'warn', message, context, source, category: 'warning' })
  }

  async error(message: string, error?: Error | string, context?: Record<string, any>, source = 'app'): Promise<void> {
    await this.log({ 
      level: 'error', 
      message, 
      error: error instanceof Error ? error.message : error,
      context: {
        ...context,
        stack: error instanceof Error ? error.stack : undefined
      }, 
      source, 
      category: 'error' 
    })
  }

  async critical(message: string, error?: Error | string, context?: Record<string, any>, source = 'app'): Promise<void> {
    await this.log({ 
      level: 'critical', 
      message, 
      error: error instanceof Error ? error.message : error,
      context: {
        ...context,
        stack: error instanceof Error ? error.stack : undefined
      }, 
      source, 
      category: 'critical' 
    })

    // Send immediate alert for critical errors
    await this.sendCriticalAlert(message, error, context)
  }

  // Business-specific logging methods
  async logTestCompletion(customerId: string, testResult: string, context?: Record<string, any>): Promise<void> {
    await this.log({
      level: 'info',
      message: `Test completed for customer ${customerId}: ${testResult}`,
      context: { customerId, testResult, ...context },
      source: 'test-system',
      category: 'business-event'
    })
  }

  async logPaymentReceived(customerId: string, amount: number, context?: Record<string, any>): Promise<void> {
    await this.log({
      level: 'info',
      message: `Payment received from customer ${customerId}: $${amount}`,
      context: { customerId, amount, ...context },
      source: 'payment-system',
      category: 'business-event'
    })
  }

  async logAutomationAction(action: string, success: boolean, context?: Record<string, any>): Promise<void> {
    await this.log({
      level: success ? 'info' : 'warn',
      message: `Automation action ${success ? 'completed' : 'failed'}: ${action}`,
      context: { action, success, ...context },
      source: 'automation-engine',
      category: 'automation'
    })
  }

  async logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>): Promise<void> {
    const level: LogLevel = severity === 'high' ? 'critical' : severity === 'medium' ? 'error' : 'warn'
    
    await this.log({
      level,
      message: `Security event: ${event}`,
      context: { event, severity, ...context },
      source: 'security-system',
      category: 'security'
    })
  }

  async logPerformanceMetric(metric: string, value: number, context?: Record<string, any>): Promise<void> {
    await this.log({
      level: 'info',
      message: `Performance metric: ${metric} = ${value}`,
      context: { metric, value, ...context },
      source: 'performance-monitor',
      category: 'performance'
    })
  }

  // Private helper methods
  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'critical']
    const minLevelIndex = levels.indexOf(this.config.minLevel)
    const currentLevelIndex = levels.indexOf(level)
    return currentLevelIndex >= minLevelIndex
  }

  private logToConsole(entry: LogEntry): void {
    const color = this.getConsoleColor(entry.level)
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`
    
    console.log(`${color}${prefix} ${entry.message}%c`, 'color: inherit')
    
    if (entry.context) {
      console.log('Context:', entry.context)
    }
    
    if (entry.error) {
      console.error('Error:', entry.error)
    }
  }

  private getConsoleColor(level: LogLevel): string {
    const colors = {
      debug: '%c',
      info: '%c',
      warn: '%c',
      error: '%c',
      critical: '%c'
    }
    return colors[level]
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return

    const logs = [...this.logQueue]
    this.logQueue = []

    try {
      // Database logging
      if (this.config.enableDatabase) {
        await this.logToDatabase(logs)
      }

      // Remote logging service
      if (this.config.enableRemote) {
        await this.logToRemote(logs)
      }

      this.retryCount = 0 // Reset retry count on success

    } catch (error) {
      console.error('Failed to flush logs:', error)
      
      // Retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++
        // Put logs back in queue for retry
        this.logQueue.unshift(...logs)
        
        // Exponential backoff
        const delay = Math.pow(2, this.retryCount) * 1000
        setTimeout(() => this.flushLogs(), delay)
      } else {
        console.error(`Dropped ${logs.length} log entries after ${this.config.maxRetries} retries`)
        this.retryCount = 0
      }
    }
  }

  private async logToDatabase(logs: LogEntry[]): Promise<void> {
    try {
      const supabase = this.supabase
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { error } = await supabase
        .from('system_logs')
        .insert(logs.map(log => ({
          level: log.level,
          message: log.message,
          context: log.context,
          error_message: log.error,
          user_id: log.userId,
          session_id: log.sessionId,
          user_agent: log.userAgent,
          ip_address: log.ipAddress,
          timestamp: log.timestamp,
          source: log.source,
          category: log.category,
          metadata: log.metadata
        })))

      if (error) {
        throw error
      }

    } catch (error) {
      console.error('Database logging failed:', error)
      throw error
    }
  }

  private async logToRemote(logs: LogEntry[]): Promise<void> {
    // Implementation for external logging service (e.g., DataDog, LogRocket, etc.)
    try {
      const response = await fetch('/api/logs/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      })

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.statusText}`)
      }

    } catch (error) {
      console.error('Remote logging failed:', error)
      // Don't throw here - database logging is more important
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs().catch(console.error)
    }, this.config.flushInterval)
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const supabase = this.supabase
      if (!supabase) return undefined
      
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id
    } catch {
      return undefined
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session'
    
    let sessionId = sessionStorage.getItem('fisher-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('fisher-session-id', sessionId)
    }
    return sessionId
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
  }

  private async getIPAddress(): Promise<string> {
    // This would be set by middleware in a real application
    return 'unknown'
  }

  private async sendCriticalAlert(message: string, error?: Error | string, context?: Record<string, any>): Promise<void> {
    try {
      // Send push notification to admins
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🚨 Critical System Alert',
          message: message,
          type: 'critical_error',
          requireInteraction: true,
          data: {
            error: error instanceof Error ? error.message : error,
            context,
            timestamp: new Date().toISOString()
          },
          actions: [
            { action: 'view-dashboard', title: 'View Dashboard' },
            { action: 'view-logs', title: 'View Logs' }
          ]
        })
      })

      // Could also send email, SMS, or webhook to external monitoring
    } catch (alertError) {
      console.error('Failed to send critical alert:', alertError)
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    
    // Final flush before destroying
    this.flushLogs().catch(console.error)
  }
}

// Create singleton instance
export const logger = new Logger()

// Error boundary helper
export function withErrorLogging<T extends (...args: any[]) => any>(
  fn: T,
  source = 'app',
  category = 'function-error'
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args)
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch(async (error) => {
          await logger.error(
            `Function ${fn.name} failed`,
            error,
            { args, source, category }
          )
          throw error
        })
      }
      
      return result
    } catch (error) {
      logger.error(
        `Function ${fn.name} failed`,
        error,
        { args, source, category }
      ).catch(console.error)
      throw error
    }
  }) as T
}

// Performance monitoring helper
export function withPerformanceLogging<T extends (...args: any[]) => any>(
  fn: T,
  threshold = 1000 // ms
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now()
    
    try {
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          if (duration > threshold) {
            logger.logPerformanceMetric(
              `slow-function-${fn.name}`,
              duration,
              { args, threshold }
            ).catch(console.error)
          }
        })
      }
      
      const duration = performance.now() - start
      if (duration > threshold) {
        logger.logPerformanceMetric(
          `slow-function-${fn.name}`,
          duration,
          { args, threshold }
        ).catch(console.error)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      logger.error(
        `Function ${fn.name} failed after ${duration}ms`,
        error,
        { args, duration }
      ).catch(console.error)
      throw error
    }
  }) as T
}

// Cleanup on app shutdown
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.destroy()
  })
}