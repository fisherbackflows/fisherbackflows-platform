/**
 * Comprehensive Health Check Endpoint
 * Provides detailed system health status for all services
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  error?: string
  details?: any
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: HealthCheck[]
  summary: {
    total: number
    healthy: number
    degraded: number
    unhealthy: number
  }
}

const startTime = Date.now()

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: 0,
        error: 'Supabase environment variables not configured'
      }
    }
    
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/customers?select=id&limit=1`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - start

    if (!testResponse.ok) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${testResponse.status}: ${testResponse.statusText}`
      }
    }

    const status = responseTime > 1000 ? 'degraded' : 'healthy'

    return {
      service: 'database',
      status,
      responseTime,
      details: {
        connected: true,
        queryExecuted: true
      }
    }
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return {
        service: 'redis',
        status: 'degraded',
        responseTime: 0,
        error: 'Redis not configured'
      }
    }

    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    const responseTime = Date.now() - start

    if (!response.ok) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime,
        error: `Redis ping failed: ${response.status}`
      }
    }

    const status = responseTime > 500 ? 'degraded' : 'healthy'

    return {
      service: 'redis',
      status,
      responseTime,
      details: {
        pingSuccessful: true
      }
    }
  } catch (error) {
    return {
      service: 'redis',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Redis connection failed'
    }
  }
}

async function checkQStash(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    if (!process.env.QSTASH_TOKEN) {
      return {
        service: 'qstash',
        status: 'degraded',
        responseTime: 0,
        error: 'QStash not configured'
      }
    }

    const response = await fetch('https://qstash.upstash.io/v2/topics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    const responseTime = Date.now() - start

    if (!response.ok) {
      return {
        service: 'qstash',
        status: 'unhealthy',
        responseTime,
        error: `QStash API error: ${response.status}`
      }
    }

    const status = responseTime > 2000 ? 'degraded' : 'healthy'

    return {
      service: 'qstash',
      status,
      responseTime,
      details: {
        apiAccessible: true,
        authenticated: true
      }
    }
  } catch (error) {
    return {
      service: 'qstash',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'QStash connection failed'
    }
  }
}

async function checkResend(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        service: 'resend',
        status: 'degraded',
        responseTime: 0,
        error: 'Resend not configured'
      }
    }

    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const responseTime = Date.now() - start

    if (!response.ok) {
      return {
        service: 'resend',
        status: 'unhealthy',
        responseTime,
        error: `Resend API error: ${response.status}`
      }
    }

    const status = responseTime > 2000 ? 'degraded' : 'healthy'

    return {
      service: 'resend',
      status,
      responseTime,
      details: {
        apiAccessible: true,
        authenticated: true
      }
    }
  } catch (error) {
    return {
      service: 'resend',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Resend connection failed'
    }
  }
}

async function checkMemory(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    const memoryUsage = process.memoryUsage()
    const totalMemory = memoryUsage.heapTotal
    const usedMemory = memoryUsage.heapUsed
    const memoryUsagePercent = (usedMemory / totalMemory) * 100

    const responseTime = Date.now() - start

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (memoryUsagePercent > 95) {
      status = 'unhealthy'
    } else if (memoryUsagePercent > 80) {
      status = 'degraded'
    }

    return {
      service: 'memory',
      status,
      responseTime,
      details: {
        heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
        heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
        heapUsagePercent: Math.round(memoryUsagePercent),
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      }
    }
  } catch (error) {
    return {
      service: 'memory',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Memory check failed'
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestStart = Date.now()
  const requestId = crypto.randomUUID()

  try {
    logger.info('Health check requested', { requestId })

    // Run all health checks in parallel
    const [database, redis, qstash, resend, memory] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkQStash(),
      checkResend(),
      checkMemory()
    ])

    const checks = [database, redis, qstash, resend, memory]

    // Calculate overall status
    const healthyCount = checks.filter(c => c.status === 'healthy').length
    const degradedCount = checks.filter(c => c.status === 'degraded').length
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedCount > 0) {
      overallStatus = 'degraded'
    }

    const uptime = Date.now() - startTime

    const healthResponse: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime,
      checks,
      summary: {
        total: checks.length,
        healthy: healthyCount,
        degraded: degradedCount,
        unhealthy: unhealthyCount
      }
    }

    const totalResponseTime = Date.now() - requestStart

    logger.info('Health check completed', {
      requestId,
      status: overallStatus,
      responseTime: totalResponseTime,
      summary: healthResponse.summary
    })

    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200

    return NextResponse.json(healthResponse, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Response-Time': totalResponseTime.toString()
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Health check failed'
    
    logger.error('Health check error', {
      requestId,
      error: errorMessage,
      responseTime: Date.now() - requestStart
    })

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      requestId
    }, { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    })
  }
}