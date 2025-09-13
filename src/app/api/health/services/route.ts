/**
 * External Services Health Check Endpoint
 * Checks Redis, QStash, Resend, and other external service dependencies
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'not_configured'
  responseTime: number
  error?: string
  details?: any
}

interface ServicesHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: ServiceStatus[]
  summary: {
    total: number
    healthy: number
    degraded: number
    unhealthy: number
    notConfigured: number
  }
}

async function checkRedisService(): Promise<ServiceStatus> {
  const start = Date.now()
  
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return {
        name: 'redis',
        status: 'not_configured',
        responseTime: 0,
        error: 'Redis configuration missing'
      }
    }

    // Test Redis connectivity with a ping
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
        name: 'redis',
        status: 'unhealthy',
        responseTime,
        error: `Redis ping failed: ${response.status} ${response.statusText}`
      }
    }

    // Test basic SET/GET operations
    const testKey = `health_check_${Date.now()}`
    const testValue = 'test_value'

    const setResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${testKey}/${testValue}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['EX', 10]) // Expire in 10 seconds
    })

    const getResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${testKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    const getValue = await getResponse.json()
    const totalResponseTime = Date.now() - start

    // Cleanup
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/del/${testKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    const operationsSuccessful = setResponse.ok && getResponse.ok && getValue.result === testValue
    const status = totalResponseTime > 1000 ? 'degraded' : 
                  operationsSuccessful ? 'healthy' : 'unhealthy'

    return {
      name: 'redis',
      status,
      responseTime: totalResponseTime,
      details: {
        pingSuccessful: response.ok,
        setOperationSuccessful: setResponse.ok,
        getOperationSuccessful: getResponse.ok && getValue.result === testValue,
        avgOperationTime: Math.round(totalResponseTime / 3)
      }
    }

  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Redis connection failed'
    }
  }
}

async function checkQStashService(): Promise<ServiceStatus> {
  const start = Date.now()

  try {
    if (!process.env.QSTASH_TOKEN) {
      return {
        name: 'qstash',
        status: 'not_configured',
        responseTime: 0,
        error: 'QStash token not configured'
      }
    }

    // Check QStash API accessibility
    const response = await fetch('https://qstash.upstash.io/v2/messages', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    const responseTime = Date.now() - start

    if (!response.ok) {
      return {
        name: 'qstash',
        status: 'unhealthy',
        responseTime,
        error: `QStash API error: ${response.status} ${response.statusText}`
      }
    }

    // Check message limits and usage
    const usageHeaders = {
      dailyLimit: response.headers.get('upstash-ratelimit-limit'),
      dailyRemaining: response.headers.get('upstash-ratelimit-remaining'),
      resetTime: response.headers.get('upstash-ratelimit-reset')
    }

    const status = responseTime > 3000 ? 'degraded' : 'healthy'

    return {
      name: 'qstash',
      status,
      responseTime,
      details: {
        apiAccessible: true,
        authenticated: true,
        usage: usageHeaders
      }
    }

  } catch (error) {
    return {
      name: 'qstash',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'QStash connection failed'
    }
  }
}

async function checkResendService(): Promise<ServiceStatus> {
  const start = Date.now()

  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        name: 'resend',
        status: 'not_configured',
        responseTime: 0,
        error: 'Resend API key not configured'
      }
    }

    // Check Resend API accessibility and domain configuration
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
        name: 'resend',
        status: 'unhealthy',
        responseTime,
        error: `Resend API error: ${response.status} ${response.statusText}`
      }
    }

    const domains = await response.json()
    const verifiedDomains = domains.data?.filter((d: any) => d.status === 'verified') || []

    const status = responseTime > 2000 ? 'degraded' : 'healthy'

    return {
      name: 'resend',
      status,
      responseTime,
      details: {
        apiAccessible: true,
        authenticated: true,
        totalDomains: domains.data?.length || 0,
        verifiedDomains: verifiedDomains.length,
        hasVerifiedDomain: verifiedDomains.length > 0
      }
    }

  } catch (error) {
    return {
      name: 'resend',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Resend connection failed'
    }
  }
}

async function checkStripeService(): Promise<ServiceStatus> {
  const start = Date.now()

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        name: 'stripe',
        status: 'not_configured',
        responseTime: 0,
        error: 'Stripe secret key not configured'
      }
    }

    // Test Stripe API accessibility
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const responseTime = Date.now() - start

    if (!response.ok) {
      return {
        name: 'stripe',
        status: 'unhealthy',
        responseTime,
        error: `Stripe API error: ${response.status} ${response.statusText}`
      }
    }

    const account = await response.json()
    const status = responseTime > 2000 ? 'degraded' : 'healthy'

    return {
      name: 'stripe',
      status,
      responseTime,
      details: {
        apiAccessible: true,
        authenticated: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      }
    }

  } catch (error) {
    return {
      name: 'stripe',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Stripe connection failed'
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestStart = Date.now()
  const requestId = crypto.randomUUID()

  try {
    logger.info('Services health check requested', { requestId })

    // Run all service checks in parallel
    const [redis, qstash, resend, stripe] = await Promise.all([
      checkRedisService(),
      checkQStashService(),
      checkResendService(),
      checkStripeService()
    ])

    const services = [redis, qstash, resend, stripe]

    // Calculate summary
    const summary = {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      unhealthy: services.filter(s => s.status === 'unhealthy').length,
      notConfigured: services.filter(s => s.status === 'not_configured').length
    }

    // Determine overall status (ignoring not_configured services)
    const activeServices = services.filter(s => s.status !== 'not_configured')
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (activeServices.some(s => s.status === 'unhealthy')) {
      overallStatus = 'unhealthy'
    } else if (activeServices.some(s => s.status === 'degraded')) {
      overallStatus = 'degraded'
    }

    const totalResponseTime = Date.now() - requestStart

    const healthResponse: ServicesHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      summary
    }

    logger.info('Services health check completed', {
      requestId,
      status: overallStatus,
      responseTime: totalResponseTime,
      summary
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
    const errorMessage = error instanceof Error ? error.message : 'Services health check failed'
    
    logger.error('Services health check error', {
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