// System Health Monitoring Service
// Monitors database, APIs, external services, and application performance

import { createClient } from '@supabase/supabase-js'
import { notifications } from '../notifications/unified-notifications'

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface ComponentHealth {
  name: string
  status: HealthStatus
  responseTime?: number
  message?: string
  lastChecked: Date
  metadata?: Record<string, any>
}

export interface SystemHealth {
  overall: HealthStatus
  components: ComponentHealth[]
  lastChecked: Date
  uptime: number
  version: string
}

export interface HealthAlert {
  component: string
  status: HealthStatus
  message: string
  timestamp: Date
  resolved?: boolean
  resolvedAt?: Date
}

class SystemHealthMonitor {
  private supabase
  private healthChecks: Map<string, () => Promise<ComponentHealth>> = new Map()
  private alertThresholds = {
    responseTime: 5000, // 5 seconds
    errorRate: 0.05, // 5%
    consecutiveFailures: 3
  }
  private isMonitoring = false
  private monitoringInterval?: NodeJS.Timeout
  private lastAlerts: Map<string, HealthAlert> = new Map()

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    this.initializeHealthChecks()
  }

  // ====================
  // HEALTH CHECK REGISTRATION
  // ====================

  private initializeHealthChecks() {
    // Database connectivity
    this.healthChecks.set('database', async () => {
      const startTime = Date.now()
      try {
        const { error } = await this.supabase
          .from('customers')
          .select('id')
          .limit(1)
        
        const responseTime = Date.now() - startTime
        
        if (error) {
          return {
            name: 'database',
            status: 'unhealthy',
            responseTime,
            message: `Database error: ${error.message}`,
            lastChecked: new Date()
          }
        }

        return {
          name: 'database',
          status: responseTime > this.alertThresholds.responseTime ? 'degraded' : 'healthy',
          responseTime,
          message: responseTime > this.alertThresholds.responseTime ? 'Slow response time' : 'Connected',
          lastChecked: new Date()
        }
      } catch (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'Database connection failed',
          lastChecked: new Date()
        }
      }
    })

    // Email service health
    this.healthChecks.set('email', async () => {
      const startTime = Date.now()
      try {
        // Check if any email service is configured
        const gmailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
        const sendgridConfigured = !!process.env.SENDGRID_API_KEY
        const sesConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
        
        const configuredServices = [gmailConfigured, sendgridConfigured, sesConfigured].filter(Boolean).length
        
        if (configuredServices === 0) {
          return {
            name: 'email',
            status: 'degraded',
            responseTime: Date.now() - startTime,
            message: 'No email services configured - using mock mode',
            lastChecked: new Date(),
            metadata: { mockMode: true }
          }
        }

        // Test email service connectivity (lightweight check)
        const responseTime = Date.now() - startTime
        return {
          name: 'email',
          status: 'healthy',
          responseTime,
          message: `${configuredServices} email service(s) configured`,
          lastChecked: new Date(),
          metadata: { 
            gmail: gmailConfigured,
            sendgrid: sendgridConfigured,
            ses: sesConfigured
          }
        }
      } catch (error) {
        return {
          name: 'email',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'Email service check failed',
          lastChecked: new Date()
        }
      }
    })

    // SMS service health
    this.healthChecks.set('sms', async () => {
      const startTime = Date.now()
      try {
        const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
        
        if (!twilioConfigured) {
          return {
            name: 'sms',
            status: 'degraded',
            responseTime: Date.now() - startTime,
            message: 'SMS service not configured - using mock mode',
            lastChecked: new Date(),
            metadata: { mockMode: true }
          }
        }

        const responseTime = Date.now() - startTime
        return {
          name: 'sms',
          status: 'healthy',
          responseTime,
          message: 'SMS service configured',
          lastChecked: new Date(),
          metadata: { twilio: true }
        }
      } catch (error) {
        return {
          name: 'sms',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'SMS service check failed',
          lastChecked: new Date()
        }
      }
    })

    // Payment service health
    this.healthChecks.set('payments', async () => {
      const startTime = Date.now()
      try {
        const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY)
        
        if (!stripeConfigured) {
          return {
            name: 'payments',
            status: 'degraded',
            responseTime: Date.now() - startTime,
            message: 'Payment service not configured - using mock mode',
            lastChecked: new Date(),
            metadata: { mockMode: true }
          }
        }

        const responseTime = Date.now() - startTime
        return {
          name: 'payments',
          status: 'healthy',
          responseTime,
          message: 'Payment service configured',
          lastChecked: new Date(),
          metadata: { stripe: true }
        }
      } catch (error) {
        return {
          name: 'payments',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'Payment service check failed',
          lastChecked: new Date()
        }
      }
    })

    // Authentication service health
    this.healthChecks.set('auth', async () => {
      const startTime = Date.now()
      try {
        // Test auth service
        const { data, error } = await this.supabase.auth.getUser()
        
        const responseTime = Date.now() - startTime
        
        return {
          name: 'auth',
          status: responseTime > this.alertThresholds.responseTime ? 'degraded' : 'healthy',
          responseTime,
          message: 'Authentication service operational',
          lastChecked: new Date()
        }
      } catch (error) {
        return {
          name: 'auth',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'Auth service check failed',
          lastChecked: new Date()
        }
      }
    })

    // File storage health
    this.healthChecks.set('storage', async () => {
      const startTime = Date.now()
      try {
        // Test storage connectivity
        const { data, error } = await this.supabase.storage.listBuckets()
        
        const responseTime = Date.now() - startTime
        
        if (error) {
          return {
            name: 'storage',
            status: 'unhealthy',
            responseTime,
            message: `Storage error: ${error.message}`,
            lastChecked: new Date()
          }
        }

        return {
          name: 'storage',
          status: responseTime > this.alertThresholds.responseTime ? 'degraded' : 'healthy',
          responseTime,
          message: `Storage operational (${data?.length || 0} buckets)`,
          lastChecked: new Date(),
          metadata: { bucketCount: data?.length || 0 }
        }
      } catch (error) {
        return {
          name: 'storage',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'Storage check failed',
          lastChecked: new Date()
        }
      }
    })

    // Application metrics
    this.healthChecks.set('application', async () => {
      const startTime = Date.now()
      try {
        const memoryUsage = process.memoryUsage()
        const uptime = process.uptime()
        
        // Check memory usage (warn if over 80% of heap used)
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        const responseTime = Date.now() - startTime
        
        let status: HealthStatus = 'healthy'
        let message = 'Application running normally'
        
        if (memoryUsagePercent > 90) {
          status = 'unhealthy'
          message = 'Critical memory usage'
        } else if (memoryUsagePercent > 80) {
          status = 'degraded'
          message = 'High memory usage'
        }

        return {
          name: 'application',
          status,
          responseTime,
          message,
          lastChecked: new Date(),
          metadata: {
            uptime,
            memory: memoryUsage,
            memoryUsagePercent: Math.round(memoryUsagePercent),
            nodeVersion: process.version,
            platform: process.platform
          }
        }
      } catch (error) {
        return {
          name: 'application',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'Application metrics check failed',
          lastChecked: new Date()
        }
      }
    })
  }

  // ====================
  // HEALTH CHECK EXECUTION
  // ====================

  /**
   * Run all health checks
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now()
    const components: ComponentHealth[] = []
    
    // Run all health checks in parallel
    const checkPromises = Array.from(this.healthChecks.entries()).map(async ([name, checkFn]) => {
      try {
        return await checkFn()
      } catch (error) {
        return {
          name,
          status: 'unhealthy' as HealthStatus,
          message: error instanceof Error ? error.message : 'Health check failed',
          lastChecked: new Date()
        }
      }
    })

    const results = await Promise.all(checkPromises)
    components.push(...results)

    // Determine overall health status
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length
    const degradedCount = components.filter(c => c.status === 'degraded').length
    
    let overallStatus: HealthStatus = 'healthy'
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedCount > 0) {
      overallStatus = 'degraded'
    }

    const systemHealth: SystemHealth = {
      overall: overallStatus,
      components,
      lastChecked: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }

    // Store health status in database
    await this.storeHealthStatus(systemHealth)
    
    // Check for alerts
    await this.checkForAlerts(components)

    return systemHealth
  }

  /**
   * Check specific component health
   */
  async checkComponentHealth(componentName: string): Promise<ComponentHealth | null> {
    const checkFn = this.healthChecks.get(componentName)
    if (!checkFn) {
      return null
    }

    try {
      return await checkFn()
    } catch (error) {
      return {
        name: componentName,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
        lastChecked: new Date()
      }
    }
  }

  // ====================
  // CONTINUOUS MONITORING
  // ====================

  /**
   * Start continuous health monitoring
   */
  startMonitoring(intervalMinutes: number = 5) {
    if (this.isMonitoring) {
      this.stopMonitoring()
    }

    console.log(`🏥 Starting health monitoring (every ${intervalMinutes} minutes)`)
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkSystemHealth()
      } catch (error) {
        console.error('Health monitoring error:', error)
        await this.logEvent('ERROR', 'Health monitoring failed', { error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }, intervalMinutes * 60 * 1000)

    this.isMonitoring = true

    // Run initial health check
    this.checkSystemHealth().catch(error => {
      console.error('Initial health check failed:', error)
    })
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }
    this.isMonitoring = false
    console.log('🛑 Health monitoring stopped')
  }

  // ====================
  // ALERTING
  // ====================

  private async checkForAlerts(components: ComponentHealth[]) {
    for (const component of components) {
      const lastAlert = this.lastAlerts.get(component.name)
      
      // Check if we need to send an alert
      if (component.status === 'unhealthy' || component.status === 'degraded') {
        // Only send alert if status changed or it's been a while since last alert
        if (!lastAlert || 
            lastAlert.status !== component.status ||
            (Date.now() - lastAlert.timestamp.getTime()) > 30 * 60 * 1000) { // 30 minutes
          
          await this.sendAlert(component)
          
          this.lastAlerts.set(component.name, {
            component: component.name,
            status: component.status,
            message: component.message || 'No message',
            timestamp: new Date()
          })
        }
      } else if (component.status === 'healthy' && lastAlert && !lastAlert.resolved) {
        // Send recovery notification
        await this.sendRecoveryAlert(component, lastAlert)
        
        this.lastAlerts.set(component.name, {
          ...lastAlert,
          resolved: true,
          resolvedAt: new Date()
        })
      }
    }
  }

  private async sendAlert(component: ComponentHealth) {
    const alertType = component.status === 'unhealthy' ? 'CRITICAL' : 'WARNING'
    const subject = `${alertType}: ${component.name} service ${component.status}`
    
    console.error(`🚨 ${subject}: ${component.message}`)
    
    // Log the alert
    await this.logEvent('ERROR', subject, {
      component: component.name,
      status: component.status,
      message: component.message,
      responseTime: component.responseTime,
      metadata: component.metadata
    })

    // Send notification to admins (if notification service is working)
    try {
      await notifications.sendNotification({
        recipient: { email: process.env.COMPANY_EMAIL! },
        channel: 'system_alert',
        type: ['email'],
        templateData: {
          alertType: subject,
          message: component.message || 'No details available',
          timestamp: new Date().toISOString(),
          actionRequired: component.status === 'unhealthy' ? 'Immediate attention required' : 'Monitor closely'
        },
        priority: component.status === 'unhealthy' ? 'urgent' : 'high'
      })
    } catch (error) {
      console.error('Failed to send health alert notification:', error)
    }
  }

  private async sendRecoveryAlert(component: ComponentHealth, lastAlert: HealthAlert) {
    const subject = `RECOVERED: ${component.name} service is now healthy`
    
    console.log(`✅ ${subject}`)
    
    // Log the recovery
    await this.logEvent('INFO', subject, {
      component: component.name,
      previousStatus: lastAlert.status,
      currentStatus: component.status,
      downtime: Date.now() - lastAlert.timestamp.getTime()
    })

    // Send recovery notification
    try {
      await notifications.sendNotification({
        recipient: { email: process.env.COMPANY_EMAIL! },
        channel: 'system_alert',
        type: ['email'],
        templateData: {
          alertType: subject,
          message: `Service has recovered from ${lastAlert.status} status`,
          timestamp: new Date().toISOString()
        },
        priority: 'normal'
      })
    } catch (error) {
      console.error('Failed to send recovery notification:', error)
    }
  }

  // ====================
  // DATA PERSISTENCE
  // ====================

  private async storeHealthStatus(health: SystemHealth) {
    try {
      // Store overall system health
      await this.supabase
        .from('system_logs')
        .insert({
          level: health.overall === 'healthy' ? 'INFO' : health.overall === 'degraded' ? 'WARN' : 'ERROR',
          component: 'system_health',
          message: `System health check: ${health.overall}`,
          metadata: {
            overall: health.overall,
            uptime: health.uptime,
            version: health.version,
            componentCount: health.components.length,
            unhealthyComponents: health.components.filter(c => c.status === 'unhealthy').map(c => c.name),
            degradedComponents: health.components.filter(c => c.status === 'degraded').map(c => c.name)
          }
        })

      // Store individual component health
      for (const component of health.components) {
        if (component.status !== 'healthy') {
          await this.supabase
            .from('system_logs')
            .insert({
              level: component.status === 'degraded' ? 'WARN' : 'ERROR',
              component: component.name,
              message: component.message || `Component ${component.status}`,
              metadata: {
                status: component.status,
                responseTime: component.responseTime,
                lastChecked: component.lastChecked.toISOString(),
                ...component.metadata
              }
            })
        }
      }
    } catch (error) {
      console.error('Failed to store health status:', error)
    }
  }

  private async logEvent(level: 'INFO' | 'WARN' | 'ERROR', message: string, metadata: Record<string, any> = {}) {
    try {
      await this.supabase
        .from('system_logs')
        .insert({
          level,
          component: 'health_monitor',
          message,
          metadata
        })
    } catch (error) {
      console.error('Failed to log health event:', error)
    }
  }

  // ====================
  // API ENDPOINTS HELPERS
  // ====================

  /**
   * Get recent health history
   */
  async getHealthHistory(hours: number = 24): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('system_logs')
      .select('*')
      .eq('component', 'system_health')
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  /**
   * Get component metrics
   */
  async getComponentMetrics(componentName: string, hours: number = 24): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('system_logs')
      .select('*')
      .eq('component', componentName)
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  /**
   * Get system uptime statistics
   */
  getUptimeStats(): { uptime: number; uptimeFormatted: string; startTime: Date } {
    const uptime = process.uptime()
    const startTime = new Date(Date.now() - uptime * 1000)
    
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    
    const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`
    
    return {
      uptime,
      uptimeFormatted,
      startTime
    }
  }
}

// Export singleton instance
export const systemHealth = new SystemHealthMonitor()

// Auto-start monitoring if in production
if (process.env.NODE_ENV === 'production') {
  systemHealth.startMonitoring(5) // Check every 5 minutes
} else if (process.env.NODE_ENV === 'development') {
  systemHealth.startMonitoring(15) // Check every 15 minutes in dev
}