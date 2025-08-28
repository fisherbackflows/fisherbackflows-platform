import { logger } from '../logger';
import { cache } from '../cache';
import { errorManager } from '../error-handling/error-manager';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percentage';
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface ApplicationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }>;
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
  };
}

class ApplicationMonitor {
  private metrics = new Map<string, PerformanceMetric[]>();
  private healthChecks = new Map<string, () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>>();
  private performanceObservers = new Map<string, PerformanceObserver>();
  private startTime = Date.now();

  constructor() {
    this.initializeDefaultHealthChecks();
    this.startPerformanceMonitoring();
    this.startHealthCheckScheduler();
  }

  async recordMetric(metric: PerformanceMetric): Promise<void> {
    const key = `${metric.name}:${JSON.stringify(metric.labels || {})}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metricsList = this.metrics.get(key)!;
    metricsList.push(metric);
    
    // Keep only last 1000 metrics per key
    if (metricsList.length > 1000) {
      metricsList.shift();
    }

    // Store in cache for persistence
    await cache.set(`metric:${key}:latest`, metric, 3600);
    
    // Log significant metrics
    if (this.isSignificantMetric(metric)) {
      await logger.info('Performance metric recorded', {
        metric: metric.name,
        value: metric.value,
        unit: metric.unit,
        labels: metric.labels
      });
    }
  }

  async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: any;

    try {
      const result = await operation();
      return result;
    } catch (err) {
      success = false;
      error = err;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      await this.recordMetric({
        name: `operation_duration`,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        labels: {
          operation: operationName,
          success: success.toString(),
          ...labels
        }
      });

      if (!success) {
        await this.recordMetric({
          name: `operation_error`,
          value: 1,
          unit: 'count',
          timestamp: new Date(),
          labels: {
            operation: operationName,
            error_type: error?.constructor?.name || 'Unknown',
            ...labels
          }
        });
      }
    }
  }

  registerHealthCheck(
    name: string,
    check: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>
  ): void {
    this.healthChecks.set(name, check);
  }

  async getApplicationHealth(): Promise<ApplicationHealth> {
    const checks: ApplicationHealth['checks'] = [];
    let overallStatus: ApplicationHealth['status'] = 'healthy';

    // Execute all health checks
    for (const [name, check] of this.healthChecks.entries()) {
      const startTime = Date.now();
      
      try {
        const result = await Promise.race([
          check(),
          new Promise<{ status: 'fail'; message: string }>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);

        checks.push({
          name,
          status: result.status,
          message: result.message,
          duration: Date.now() - startTime
        });

        if (result.status === 'fail') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'warn' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }

      } catch (error: any) {
        checks.push({
          name,
          status: 'fail',
          message: error.message,
          duration: Date.now() - startTime
        });
        overallStatus = 'unhealthy';
      }
    }

    // Calculate metrics
    const metrics = await this.calculateHealthMetrics();

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks,
      metrics
    };
  }

  async getMetrics(
    name?: string,
    timeRange?: { start: Date; end: Date },
    labels?: Record<string, string>
  ): Promise<PerformanceMetric[]> {
    let results: PerformanceMetric[] = [];

    for (const [key, metricsList] of this.metrics.entries()) {
      const [metricName, labelsStr] = key.split(':');
      const metricLabels = labelsStr ? JSON.parse(labelsStr) : {};

      // Filter by name
      if (name && metricName !== name) {
        continue;
      }

      // Filter by labels
      if (labels) {
        const matchesLabels = Object.entries(labels).every(
          ([key, value]) => metricLabels[key] === value
        );
        if (!matchesLabels) {
          continue;
        }
      }

      // Filter by time range
      let filteredMetrics = metricsList;
      if (timeRange) {
        filteredMetrics = metricsList.filter(
          metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
        );
      }

      results.push(...filteredMetrics);
    }

    return results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getMetricsSummary(name: string, labels?: Record<string, string>): Promise<{
    count: number;
    average: number;
    min: number;
    max: number;
    percentiles: { p50: number; p95: number; p99: number };
  }> {
    const metrics = await this.getMetrics(name, undefined, labels);
    
    if (metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        percentiles: { p50: 0, p95: 0, p99: 0 }
      };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      average: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      percentiles: {
        p50: values[Math.floor(values.length * 0.5)],
        p95: values[Math.floor(values.length * 0.95)],
        p99: values[Math.floor(values.length * 0.99)]
      }
    };
  }

  private initializeDefaultHealthChecks(): void {
    // Database health check
    this.registerHealthCheck('database', async () => {
      try {
        const { supabase } = await import('../supabase');
        const start = Date.now();
        const { error } = await supabase.from('customers').select('count').limit(1).single();
        const duration = Date.now() - start;
        
        if (error) {
          return { status: 'fail', message: `Database error: ${error.message}` };
        }
        
        if (duration > 1000) {
          return { status: 'warn', message: `Database response slow: ${duration}ms` };
        }
        
        return { status: 'pass', message: `Database healthy (${duration}ms)` };
      } catch (error: any) {
        return { status: 'fail', message: `Database connection failed: ${error.message}` };
      }
    });

    // Cache health check
    this.registerHealthCheck('cache', async () => {
      try {
        const testKey = 'health_check_test';
        const testValue = Date.now().toString();
        
        await cache.set(testKey, testValue, 60);
        const retrieved = await cache.get(testKey);
        await cache.del(testKey);
        
        if (retrieved !== testValue) {
          return { status: 'fail', message: 'Cache read/write test failed' };
        }
        
        return { status: 'pass', message: 'Cache healthy' };
      } catch (error: any) {
        return { status: 'fail', message: `Cache error: ${error.message}` };
      }
    });

    // Memory health check
    this.registerHealthCheck('memory', async () => {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
      const usagePercent = (heapUsedMB / heapTotalMB) * 100;

      if (usagePercent > 90) {
        return { status: 'fail', message: `Memory usage critical: ${usagePercent.toFixed(1)}%` };
      }
      
      if (usagePercent > 75) {
        return { status: 'warn', message: `Memory usage high: ${usagePercent.toFixed(1)}%` };
      }
      
      return { status: 'pass', message: `Memory usage normal: ${usagePercent.toFixed(1)}%` };
    });

    // Error rate health check
    this.registerHealthCheck('error_rate', async () => {
      const errorMetrics = await errorManager.getErrorMetrics();
      const totalErrors = errorMetrics.totalErrors || 0;
      
      // Calculate error rate over last hour
      const hourlyErrorRate = totalErrors / 60; // errors per minute
      
      if (hourlyErrorRate > 10) {
        return { status: 'fail', message: `High error rate: ${hourlyErrorRate.toFixed(1)} errors/min` };
      }
      
      if (hourlyErrorRate > 5) {
        return { status: 'warn', message: `Elevated error rate: ${hourlyErrorRate.toFixed(1)} errors/min` };
      }
      
      return { status: 'pass', message: `Error rate normal: ${hourlyErrorRate.toFixed(1)} errors/min` };
    });
  }

  private startPerformanceMonitoring(): void {
    // Monitor different types of performance data
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.recordMetric({
            name: 'page_load_time',
            value: entry.loadEventEnd - entry.loadEventStart,
            unit: 'ms',
            timestamp: new Date(),
            labels: { type: 'navigation' }
          });
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.performanceObservers.set('navigation', navObserver);

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.recordMetric({
            name: 'resource_load_time',
            value: entry.responseEnd - entry.requestStart,
            unit: 'ms',
            timestamp: new Date(),
            labels: { 
              resource: entry.name,
              type: entry.initiatorType 
            }
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.performanceObservers.set('resource', resourceObserver);
    }
  }

  private startHealthCheckScheduler(): void {
    // Run health checks every 30 seconds
    setInterval(async () => {
      try {
        const health = await this.getApplicationHealth();
        
        if (health.status !== 'healthy') {
          await logger.warn('Application health degraded', {
            status: health.status,
            failedChecks: health.checks.filter(c => c.status !== 'pass')
          });
        }
        
        // Store latest health status
        await cache.set('application_health', health, 300); // 5 minutes
        
      } catch (error: any) {
        await logger.error('Health check scheduler failed', { error: error.message });
      }
    }, 30000);
  }

  private async calculateHealthMetrics(): Promise<ApplicationHealth['metrics']> {
    const responseTimeMetrics = await this.getMetricsSummary('operation_duration');
    const errorMetrics = await this.getMetricsSummary('operation_error');
    const throughputMetrics = await this.getMetrics('request_count', {
      start: new Date(Date.now() - 60000), // Last minute
      end: new Date()
    });

    return {
      responseTime: responseTimeMetrics.average,
      errorRate: errorMetrics.count / Math.max(responseTimeMetrics.count, 1) * 100,
      throughput: throughputMetrics.length,
      uptime: (Date.now() - this.startTime) / 1000
    };
  }

  private isSignificantMetric(metric: PerformanceMetric): boolean {
    // Log metrics that might indicate performance issues
    if (metric.name === 'operation_duration' && metric.value > 1000) {
      return true;
    }
    
    if (metric.name === 'memory_usage' && metric.value > 75) {
      return true;
    }
    
    if (metric.name === 'error_rate' && metric.value > 5) {
      return true;
    }
    
    return false;
  }

  async cleanup(): Promise<void> {
    // Clean up performance observers
    for (const observer of this.performanceObservers.values()) {
      observer.disconnect();
    }
    this.performanceObservers.clear();

    // Clear old metrics (older than 24 hours)
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [key, metricsList] of this.metrics.entries()) {
      const filteredMetrics = metricsList.filter(
        metric => metric.timestamp.getTime() > cutoffTime
      );
      
      if (filteredMetrics.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filteredMetrics);
      }
    }
  }
}

export const applicationMonitor = new ApplicationMonitor();

// Convenience functions
export const recordMetric = (metric: PerformanceMetric): Promise<void> => {
  return applicationMonitor.recordMetric(metric);
};

export const measureOperation = <T>(
  operationName: string,
  operation: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T> => {
  return applicationMonitor.measureOperation(operationName, operation, labels);
};

export const registerHealthCheck = (
  name: string,
  check: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>
): void => {
  applicationMonitor.registerHealthCheck(name, check);
};

export const getApplicationHealth = (): Promise<ApplicationHealth> => {
  return applicationMonitor.getApplicationHealth();
};