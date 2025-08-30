// Enterprise security framework for Fisher Backflows
import { createClient } from '@/lib/supabase/client'
import { logger } from './logger'

export interface SecurityConfig {
  maxLoginAttempts: number
  lockoutDuration: number // minutes
  sessionTimeout: number // minutes
  requireMFA: boolean
  passwordMinLength: number
  passwordRequireSpecial: boolean
  encryptionKey: string
  allowedDomains: string[]
  rateLimitRequests: number
  rateLimitWindow: number // seconds
}

export interface SecurityEvent {
  type: 'login_attempt' | 'login_failure' | 'session_expired' | 'unauthorized_access' | 'suspicious_activity' | 'data_access'
  userId?: string
  ipAddress: string
  userAgent: string
  details: Record<string, unknown>
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface RateLimitEntry {
  count: number
  resetTime: number
}

class SecurityManager {
  private config: SecurityConfig
  private supabase = createClient()
  private rateLimitMap = new Map<string, RateLimitEntry>()
  private failedAttempts = new Map<string, { count: number; lastAttempt: number }>()
  private activeSessions = new Map<string, { userId: string; lastActivity: number; ipAddress: string }>()

  constructor() {
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 15, // 15 minutes
      sessionTimeout: 120, // 2 hours
      requireMFA: process.env.NODE_ENV === 'production',
      passwordMinLength: 12,
      passwordRequireSpecial: true,
      encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
      allowedDomains: ['fisherbackflows.com', 'localhost'],
      rateLimitRequests: 100,
      rateLimitWindow: 60 // 1 minute
    }

    this.startSecurityMonitoring()
    this.startSessionCleanup()
  }

  // Authentication security
  async validateLoginAttempt(identifier: string, ipAddress: string, userAgent: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(ipAddress)) {
        await this.logSecurityEvent({
          type: 'login_attempt',
          ipAddress,
          userAgent,
          details: { identifier, reason: 'rate_limit_exceeded' },
          timestamp: new Date().toISOString(),
          severity: 'medium'
        })
        
        return { allowed: false, reason: 'Rate limit exceeded. Please try again later.' }
      }

      // Check failed attempts
      const failedKey = `${identifier}:${ipAddress}`
      const failedEntry = this.failedAttempts.get(failedKey)
      
      if (failedEntry && failedEntry.count >= this.config.maxLoginAttempts) {
        const timeSinceLastAttempt = Date.now() - failedEntry.lastAttempt
        const lockoutTime = this.config.lockoutDuration * 60 * 1000

        if (timeSinceLastAttempt < lockoutTime) {
          await this.logSecurityEvent({
            type: 'login_attempt',
            ipAddress,
            userAgent,
            details: { identifier, reason: 'account_locked', attempts: failedEntry.count },
            timestamp: new Date().toISOString(),
            severity: 'high'
          })

          return { 
            allowed: false, 
            reason: `Account locked due to too many failed attempts. Try again in ${Math.ceil((lockoutTime - timeSinceLastAttempt) / 60000)} minutes.` 
          }
        } else {
          // Reset failed attempts after lockout period
          this.failedAttempts.delete(failedKey)
        }
      }

      return { allowed: true }

    } catch (error) {
      await logger.error('Login validation failed', error)
      return { allowed: false, reason: 'Security check failed' }
    }
  }

  async recordLoginAttempt(identifier: string, ipAddress: string, userAgent: string, success: boolean, userId?: string): Promise<void> {
    const failedKey = `${identifier}:${ipAddress}`

    if (success) {
      // Clear failed attempts on successful login
      this.failedAttempts.delete(failedKey)
      
      // Create session
      if (userId) {
        const sessionId = this.generateSessionId()
        this.activeSessions.set(sessionId, {
          userId,
          lastActivity: Date.now(),
          ipAddress
        })
      }

      await this.logSecurityEvent({
        type: 'login_attempt',
        userId,
        ipAddress,
        userAgent,
        details: { identifier, success: true },
        timestamp: new Date().toISOString(),
        severity: 'low'
      })

    } else {
      // Record failed attempt
      const existing = this.failedAttempts.get(failedKey) || { count: 0, lastAttempt: 0 }
      this.failedAttempts.set(failedKey, {
        count: existing.count + 1,
        lastAttempt: Date.now()
      })

      await this.logSecurityEvent({
        type: 'login_failure',
        ipAddress,
        userAgent,
        details: { 
          identifier, 
          attemptNumber: existing.count + 1,
          maxAttempts: this.config.maxLoginAttempts 
        },
        timestamp: new Date().toISOString(),
        severity: existing.count + 1 >= this.config.maxLoginAttempts ? 'high' : 'medium'
      })
    }
  }

  // Session security
  async validateSession(sessionId: string, ipAddress: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const session = this.activeSessions.get(sessionId)
      
      if (!session) {
        return { valid: false }
      }

      // Check session timeout
      const timeSinceActivity = Date.now() - session.lastActivity
      const timeoutMs = this.config.sessionTimeout * 60 * 1000

      if (timeSinceActivity > timeoutMs) {
        this.activeSessions.delete(sessionId)
        
        await this.logSecurityEvent({
          type: 'session_expired',
          userId: session.userId,
          ipAddress,
          userAgent: 'unknown',
          details: { sessionId, timeoutMinutes: this.config.sessionTimeout },
          timestamp: new Date().toISOString(),
          severity: 'low'
        })

        return { valid: false }
      }

      // Check IP address (basic session hijacking protection)
      if (session.ipAddress !== ipAddress && process.env.NODE_ENV === 'production') {
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          userId: session.userId,
          ipAddress,
          userAgent: 'unknown',
          details: { 
            sessionId, 
            originalIp: session.ipAddress,
            newIp: ipAddress,
            reason: 'ip_mismatch' 
          },
          timestamp: new Date().toISOString(),
          severity: 'high'
        })

        // Invalidate suspicious session
        this.activeSessions.delete(sessionId)
        return { valid: false }
      }

      // Update last activity
      session.lastActivity = Date.now()

      return { valid: true, userId: session.userId }

    } catch (error) {
      await logger.error('Session validation failed', error)
      return { valid: false }
    }
  }

  // Data access security
  async validateDataAccess(
    userId: string, 
    resource: string, 
    action: 'read' | 'write' | 'delete',
    resourceId?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Get user role and permissions
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role, permissions')
        .eq('id', userId)
        .single()

      if (!profile) {
        return { allowed: false, reason: 'User not found' }
      }

      // Admin has full access
      if (profile.role === 'admin') {
        return { allowed: true }
      }

      // Role-based access control
      const permissions = this.getRolePermissions(profile.role)
      const requiredPermission = `${resource}:${action}`

      if (!permissions.includes(requiredPermission) && !permissions.includes(`${resource}:*`)) {
        await this.logSecurityEvent({
          type: 'unauthorized_access',
          userId,
          ipAddress: 'unknown',
          userAgent: 'unknown',
          details: { 
            resource, 
            action, 
            resourceId,
            userRole: profile.role,
            requiredPermission 
          },
          timestamp: new Date().toISOString(),
          severity: 'medium'
        })

        return { allowed: false, reason: 'Insufficient permissions' }
      }

      // Resource-specific checks
      if (resource === 'customer' && resourceId) {
        const hasAccess = await this.checkCustomerAccess(userId, resourceId, profile.role)
        if (!hasAccess) {
          return { allowed: false, reason: 'Access denied to this customer' }
        }
      }

      // Log data access
      await this.logSecurityEvent({
        type: 'data_access',
        userId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        details: { resource, action, resourceId },
        timestamp: new Date().toISOString(),
        severity: 'low'
      })

      return { allowed: true }

    } catch (error) {
      await logger.error('Data access validation failed', error)
      return { allowed: false, reason: 'Security check failed' }
    }
  }

  // Password security
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`)
    }

    if (this.config.passwordRequireSpecial) {
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number')
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character')
      }
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common, please choose a more secure password')
    }

    return { valid: errors.length === 0, errors }
  }

  // Data encryption
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      // Simple encryption for demo - use proper encryption in production
      const encoder = new TextEncoder()
      const keyData = encoder.encode(this.config.encryptionKey)
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      )

      const iv = crypto.getRandomValues(new Uint8Array(12))
      const dataBuffer = encoder.encode(data)

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      )

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encrypted), iv.length)

      return btoa(String.fromCharCode(...combined))

    } catch (error) {
      await logger.error('Data encryption failed', error)
      throw new Error('Encryption failed')
    }
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      )

      const iv = combined.slice(0, 12)
      const encrypted = combined.slice(12)

      const encoder = new TextEncoder()
      const keyData = encoder.encode(this.config.encryptionKey)
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      )

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      )

      return new TextDecoder().decode(decrypted)

    } catch (error) {
      await logger.error('Data decryption failed', error)
      throw new Error('Decryption failed')
    }
  }

  // Security audit methods
  async getSecurityReport(): Promise<{
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
    activeThreats: number
    recentIncidents: SecurityEvent[]
    recommendations: string[]
  }> {
    try {
      // Get recent security events
      const { data: events } = await this.supabase
        .from('security_events')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(50)

      const recentIncidents = events || []
      const highSeverityCount = recentIncidents.filter(e => e.severity === 'high' || e.severity === 'critical').length
      const activeThreats = this.failedAttempts.size + Math.floor(this.rateLimitMap.size / 10)

      let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      if (highSeverityCount > 10) threatLevel = 'critical'
      else if (highSeverityCount > 5) threatLevel = 'high'
      else if (highSeverityCount > 2) threatLevel = 'medium'

      const recommendations = this.generateSecurityRecommendations(recentIncidents)

      return {
        threatLevel,
        activeThreats,
        recentIncidents,
        recommendations
      }

    } catch (error) {
      await logger.error('Security report generation failed', error)
      return {
        threatLevel: 'medium',
        activeThreats: 0,
        recentIncidents: [],
        recommendations: ['Security system error - please investigate']
      }
    }
  }

  // Private helper methods
  private checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    // Window start calculation for future rate limiting enhancements
    // const windowStart = now - (this.config.rateLimitWindow * 1000)
    
    const entry = this.rateLimitMap.get(identifier)
    
    if (!entry || entry.resetTime < now) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + (this.config.rateLimitWindow * 1000)
      })
      return true
    }

    if (entry.count >= this.config.rateLimitRequests) {
      return false
    }

    entry.count++
    return true
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }

  private getRolePermissions(role: string): string[] {
    const permissions = {
      admin: ['*:*'],
      technician: [
        'customer:read',
        'customer:write',
        'device:read',
        'device:write',
        'test:read',
        'test:write',
        'appointment:read',
        'appointment:write',
        'report:read',
        'report:write'
      ],
      customer: [
        'customer:read',
        'device:read',
        'test:read',
        'invoice:read',
        'appointment:read'
      ]
    }

    return permissions[role as keyof typeof permissions] || []
  }

  private async checkCustomerAccess(userId: string, customerId: string, role: string): Promise<boolean> {
    if (role === 'admin' || role === 'technician') {
      return true
    }

    // Customer can only access their own data
    if (role === 'customer') {
      const { data: customer } = await this.supabase
        .from('customers')
        .select('user_id')
        .eq('id', customerId)
        .single()

      return customer?.user_id === userId
    }

    return false
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'password1'
    ]

    return commonPasswords.includes(password.toLowerCase())
  }

  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await this.supabase
        .from('security_events')
        .insert({
          type: event.type,
          user_id: event.userId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          details: event.details,
          timestamp: event.timestamp,
          severity: event.severity
        })

      await logger.logSecurityEvent(event.type, event.severity, event.details)

      // Send alert for high/critical events
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.sendSecurityAlert(event)
      }

    } catch (error) {
      await logger.error('Security event logging failed', error)
    }
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🔒 Security Alert - ${event.severity.toUpperCase()}`,
          message: `Security event detected: ${event.type}`,
          type: 'security_alert',
          requireInteraction: true,
          data: {
            eventType: event.type,
            severity: event.severity,
            details: event.details,
            timestamp: event.timestamp
          }
        })
      })

    } catch (error) {
      await logger.error('Security alert failed', error)
    }
  }

  private generateSecurityRecommendations(events: SecurityEvent[]): string[] {
    const recommendations: string[] = []
    const eventTypes = events.map(e => e.type)

    if (eventTypes.filter(t => t === 'login_failure').length > 10) {
      recommendations.push('High number of login failures detected. Consider implementing CAPTCHA or additional verification.')
    }

    if (eventTypes.includes('suspicious_activity')) {
      recommendations.push('Suspicious activities detected. Review user access patterns and consider additional monitoring.')
    }

    if (eventTypes.filter(t => t === 'unauthorized_access').length > 5) {
      recommendations.push('Multiple unauthorized access attempts. Review user permissions and access controls.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture looks good. Continue monitoring for threats.')
    }

    return recommendations
  }

  private startSecurityMonitoring(): void {
    setInterval(async () => {
      // Clean up expired entries
      const now = Date.now()
      
      // Clean rate limit entries
      for (const [key, entry] of this.rateLimitMap.entries()) {
        if (entry.resetTime < now) {
          this.rateLimitMap.delete(key)
        }
      }

      // Clean failed attempt entries
      for (const [key, entry] of this.failedAttempts.entries()) {
        const timeSinceAttempt = now - entry.lastAttempt
        const lockoutTime = this.config.lockoutDuration * 60 * 1000
        
        if (timeSinceAttempt > lockoutTime * 2) { // Double the lockout time for cleanup
          this.failedAttempts.delete(key)
        }
      }

    }, 300000) // 5 minutes
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      const timeoutMs = this.config.sessionTimeout * 60 * 1000

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now - session.lastActivity > timeoutMs) {
          this.activeSessions.delete(sessionId)
        }
      }

    }, 600000) // 10 minutes
  }
}

// Create singleton instance
export const security = new SecurityManager()

// Security middleware helper
export function withSecurity(
  requiredPermission?: string,
  resourceValidator?: (userId: string, resourceId?: string) => Promise<boolean>
) {
  return function (target: Record<string, unknown>, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      try {
        // Extract user info from context (implementation depends on your auth setup)
        // This is a simplified example
        const userId = 'current-user-id' // Get from session/context
        // const ipAddress = 'client-ip' // Get from request - for future logging
        
        // Check permissions if required
        if (requiredPermission) {
          const [resource, action] = requiredPermission.split(':')
          const { allowed, reason } = await security.validateDataAccess(userId, resource, action as 'read' | 'write' | 'delete')
          
          if (!allowed) {
            throw new Error(reason || 'Access denied')
          }
        }

        // Custom resource validation
        if (resourceValidator) {
          const resourceId = args[0] // Assume first argument is resource ID
          const hasAccess = await resourceValidator(userId, resourceId)
          
          if (!hasAccess) {
            throw new Error('Resource access denied')
          }
        }

        return await originalMethod.apply(this, args)

      } catch (error) {
        await logger.error(`Security check failed for ${propertyKey}`, error)
        throw error
      }
    }

    return descriptor
  }
}