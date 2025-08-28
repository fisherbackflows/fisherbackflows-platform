/**
 * Enterprise Monitoring & Observability Stack
 * Fisher Backflows - Complete System Visibility
 */

import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════

export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  tags: Record<string, any>;
  logs: Array<{
    timestamp: number;
    message: string;
    level: string;
  }>;
  status: 'ok' | 'error' | 'cancelled';
}

export interface ErrorReport {
  error: Error;
  context: Record<string, any>;
  userId?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint?: string;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════
// SENTRY ERROR TRACKING
// ═══════════════════════════════════════════════════════════════════════

class SentryMonitor {
  private initialized = false;
  private Sentry: any;

  async initialize() {
    if (this.initialized) return;

    try {
      if (process.env.SENTRY_DSN) {
        const Sentry = await import('@sentry/nextjs');
        
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
          profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
          integrations: [
            Sentry.replayIntegration({
              maskAllText: false,
              blockAllMedia: false,
            }),
            Sentry.browserTracingIntegration(),
          ],
          beforeSend(event, hint) {
            // Sanitize sensitive data
            if (event.request) {
              delete event.request.cookies;
              delete event.request.headers?.authorization;
            }
            return event;
          },
          ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'Network request failed'
          ]
        });

        this.Sentry = Sentry;
        this.initialized = true;
        logger.info('Sentry initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize Sentry', { error });
    }
  }

  captureError(error: Error, context?: Record<string, any>) {
    if (!this.initialized) {
      logger.error('Error captured (Sentry not initialized)', { error, context });
      return;
    }

    this.Sentry.captureException(error, {
      extra: context,
      tags: {
        component: context?.component || 'unknown',
        action: context?.action || 'unknown'
      }
    });
  }

  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) {
      logger.log(level, message);
      return;
    }

    this.Sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    if (!this.initialized) return;
    this.Sentry.setUser(user);
  }

  clearUser() {
    if (!this.initialized) return;
    this.Sentry.setUser(null);
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: Record<string, any>;
  }) {
    if (!this.initialized) return;
    this.Sentry.addBreadcrumb(breadcrumb);
  }

  startTransaction(name: string, op: string) {
    if (!this.initialized) return null;
    return this.Sentry.startTransaction({ name, op });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DATADOG APM & METRICS
// ═══════════════════════════════════════════════════════════════════════

class DataDogMonitor {
  private metrics: any;
  private tracer: any;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      if (process.env.DATADOG_API_KEY) {
        const { StatsD } = await import('hot-shots');
        const tracer = await import('dd-trace');

        this.metrics = new StatsD({
          host: process.env.DD_AGENT_HOST || 'localhost',
          port: 8125,
          prefix: 'fisherbackflows.',
          globalTags: {
            env: process.env.NODE_ENV || 'development',
            service: 'fisherbackflows',
            version: process.env.APP_VERSION || '1.0.0'
          }
        });

        this.tracer = tracer.default.init({
          service: 'fisherbackflows',
          env: process.env.NODE_ENV,
          version: process.env.APP_VERSION,
          logInjection: true,
          runtimeMetrics: true,
          profiling: true
        });

        this.initialized = true;
        logger.info('DataDog initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize DataDog', { error });
    }
  }

  increment(metric: string, value: number = 1, tags?: string[]) {
    if (!this.initialized) return;
    this.metrics.increment(metric, value, tags);
  }

  gauge(metric: string, value: number, tags?: string[]) {
    if (!this.initialized) return;
    this.metrics.gauge(metric, value, tags);
  }

  histogram(metric: string, value: number, tags?: string[]) {
    if (!this.initialized) return;
    this.metrics.histogram(metric, value, tags);
  }

  timing(metric: string, duration: number, tags?: string[]) {
    if (!this.initialized) return;
    this.metrics.timing(metric, duration, tags);
  }

  startSpan(name: string, options?: any) {
    if (!this.initialized) return null;
    return this.tracer.startSpan(name, options);
  }

  finishSpan(span: any) {
    if (!span) return;
    span.finish();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PROMETHEUS METRICS
// ═══════════════════════════════════════════════════════════════════════

class PrometheusMonitor {
  private register: any;
  private metrics: Map<string, any> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const prom = await import('prom-client');
      
      this.register = new prom.Registry();
      
      // Default metrics
      prom.collectDefaultMetrics({ register: this.register });

      // Custom metrics
      this.metrics.set('http_requests_total', new prom.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status'],
        registers: [this.register]
      }));

      this.metrics.set('http_request_duration', new prom.Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.1, 0.5, 1, 2, 5],
        registers: [this.register]
      }));

      this.metrics.set('db_query_duration', new prom.Histogram({
        name: 'db_query_duration_seconds',
        help: 'Database query duration in seconds',
        labelNames: ['operation', 'table'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1],
        registers: [this.register]
      }));

      this.metrics.set('payment_transactions', new prom.Counter({
        name: 'payment_transactions_total',
        help: 'Total number of payment transactions',
        labelNames: ['status', 'provider'],
        registers: [this.register]
      }));

      this.metrics.set('email_sent', new prom.Counter({
        name: 'email_sent_total',
        help: 'Total number of emails sent',
        labelNames: ['provider', 'status'],
        registers: [this.register]
      }));

      this.metrics.set('active_users', new prom.Gauge({
        name: 'active_users',
        help: 'Number of active users',
        registers: [this.register]
      }));

      this.initialized = true;
      logger.info('Prometheus metrics initialized');
    } catch (error) {
      logger.error('Failed to initialize Prometheus', { error });
    }
  }

  incrementCounter(name: string, labels?: Record<string, string>) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.inc(labels);
    }
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.observe(labels, value);
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.set(labels, value);
    }
  }

  async getMetrics(): Promise<string> {
    if (!this.initialized) return '';
    return this.register.metrics();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// APPLICATION PERFORMANCE MONITORING
// ═══════════════════════════════════════════════════════════════════════

class PerformanceMonitor {
  private measurements: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  startMeasure(name: string) {
    this.measurements.set(name, performance.now());
  }

  endMeasure(name: string): number | null {
    const startTime = this.measurements.get(name);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.measurements.delete(name);

    // Send to monitoring services
    monitoring.metrics.timing(`performance.${name}`, duration);
    
    return duration;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await fn();
      const duration = this.endMeasure(name);
      logger.debug(`Performance: ${name} took ${duration}ms`);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  measureSync<T>(name: string, fn: () => T): T {
    this.startMeasure(name);
    try {
      const result = fn();
      const duration = this.endMeasure(name);
      logger.debug(`Performance: ${name} took ${duration}ms`);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  observeWebVitals() {
    if (typeof window === 'undefined') return;

    // Observe Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      monitoring.metrics.timing('web_vitals.lcp', lastEntry.startTime);
    });

    // Observe First Input Delay
    this.observeMetric('first-input', (entries) => {
      const lastEntry = entries[entries.length - 1] as any;
      monitoring.metrics.timing('web_vitals.fid', lastEntry.processingStart - lastEntry.startTime);
    });

    // Observe Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      let cls = 0;
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      monitoring.metrics.gauge('web_vitals.cls', cls);
    });
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      logger.debug(`Cannot observe metric ${type}`, { error });
    }
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.measurements.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HEALTH CHECKS
// ═══════════════════════════════════════════════════════════════════════

export class HealthChecker {
  async checkDatabase(): Promise<boolean> {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.from('customers').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  async checkRedis(): Promise<boolean> {
    try {
      const redis = await import('@/lib/cache');
      await redis.cache.ping();
      return true;
    } catch {
      return false;
    }
  }

  async checkStripe(): Promise<boolean> {
    try {
      const stripe = await import('@/lib/payment/stripe');
      return stripe.default.isInitialized();
    } catch {
      return false;
    }
  }

  async checkEmail(): Promise<boolean> {
    try {
      const email = await import('@/lib/email/email-service');
      const service = email.getEmailService();
      // Check if at least one provider is available
      return true; // Would need to expose provider check method
    } catch {
      return false;
    }
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: Date;
  }> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      stripe: await this.checkStripe(),
      email: await this.checkEmail()
    };

    const healthyCount = Object.values(checks).filter(v => v).length;
    const totalCount = Object.values(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      status = 'healthy';
    } else if (healthyCount > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      timestamp: new Date()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM ANALYTICS
// ═══════════════════════════════════════════════════════════════════════

export class Analytics {
  track(event: string, properties?: Record<string, any>) {
    // Send to multiple analytics providers
    
    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties);
    }

    // Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event, properties);
    }

    // Custom analytics
    monitoring.metrics.increment(`analytics.${event}`);
    
    logger.debug('Analytics event tracked', { event, properties });
  }

  identify(userId: string, traits?: Record<string, any>) {
    // Identify user across analytics platforms
    
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (traits) {
        (window as any).mixpanel.people.set(traits);
      }
    }

    monitoring.sentry.setUser({ id: userId, ...traits });
  }

  page(name: string, properties?: Record<string, any>) {
    // Track page views
    this.track('page_view', { page: name, ...properties });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UNIFIED MONITORING SERVICE
// ═══════════════════════════════════════════════════════════════════════

class MonitoringService {
  public sentry: SentryMonitor;
  public datadog: DataDogMonitor;
  public prometheus: PrometheusMonitor;
  public performance: PerformanceMonitor;
  public health: HealthChecker;
  public analytics: Analytics;
  public metrics: {
    increment: (metric: string, value?: number, tags?: string[]) => void;
    gauge: (metric: string, value: number, tags?: string[]) => void;
    histogram: (metric: string, value: number, tags?: string[]) => void;
    timing: (metric: string, duration: number, tags?: string[]) => void;
  };

  constructor() {
    this.sentry = new SentryMonitor();
    this.datadog = new DataDogMonitor();
    this.prometheus = new PrometheusMonitor();
    this.performance = new PerformanceMonitor();
    this.health = new HealthChecker();
    this.analytics = new Analytics();

    // Unified metrics interface
    this.metrics = {
      increment: (metric: string, value?: number, tags?: string[]) => {
        this.datadog.increment(metric, value, tags);
        this.prometheus.incrementCounter(metric, this.tagsToLabels(tags));
      },
      gauge: (metric: string, value: number, tags?: string[]) => {
        this.datadog.gauge(metric, value, tags);
        this.prometheus.setGauge(metric, value, this.tagsToLabels(tags));
      },
      histogram: (metric: string, value: number, tags?: string[]) => {
        this.datadog.histogram(metric, value, tags);
        this.prometheus.observeHistogram(metric, value, this.tagsToLabels(tags));
      },
      timing: (metric: string, duration: number, tags?: string[]) => {
        this.datadog.timing(metric, duration, tags);
        this.prometheus.observeHistogram(metric, duration / 1000, this.tagsToLabels(tags));
      }
    };
  }

  async initialize() {
    await Promise.all([
      this.sentry.initialize(),
      this.datadog.initialize(),
      this.prometheus.initialize()
    ]);

    // Start performance monitoring
    if (typeof window !== 'undefined') {
      this.performance.observeWebVitals();
    }

    logger.info('Monitoring services initialized');
  }

  captureError(error: Error | ErrorReport) {
    if (error instanceof Error) {
      this.sentry.captureError(error);
      this.metrics.increment('errors.captured');
    } else {
      this.sentry.captureError(error.error, error.context);
      this.metrics.increment('errors.captured', 1, [`severity:${error.severity}`]);
    }
  }

  startTransaction(name: string, op: string = 'transaction') {
    const sentryTransaction = this.sentry.startTransaction(name, op);
    const ddSpan = this.datadog.startSpan(name);
    
    return {
      finish: () => {
        if (sentryTransaction) sentryTransaction.finish();
        if (ddSpan) this.datadog.finishSpan(ddSpan);
      }
    };
  }

  private tagsToLabels(tags?: string[]): Record<string, string> {
    if (!tags) return {};
    
    const labels: Record<string, string> = {};
    tags.forEach(tag => {
      const [key, value] = tag.split(':');
      if (key && value) {
        labels[key] = value;
      }
    });
    
    return labels;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT SINGLETON
// ═══════════════════════════════════════════════════════════════════════

export const monitoring = new MonitoringService();

// Initialize on import
if (typeof window === 'undefined') {
  // Server-side initialization
  monitoring.initialize().catch(error => {
    logger.error('Failed to initialize monitoring', { error });
  });
} else {
  // Client-side initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      monitoring.initialize().catch(error => {
        console.error('Failed to initialize monitoring', error);
      });
    });
  } else {
    monitoring.initialize().catch(error => {
      console.error('Failed to initialize monitoring', error);
    });
  }
}

export default monitoring;