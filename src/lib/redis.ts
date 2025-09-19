/**
 * Simple Redis Cache Implementation using Upstash REST API
 * Fisher Backflows - Production-ready caching
 */

import { logger } from '@/lib/logger'

export interface CacheOptions {
  ttl?: number
  prefix?: string
}

class SimpleCache {
  private baseURL: string
  private token: string
  private defaultTTL = 3600 // 1 hour

  constructor() {
    this.baseURL = process.env.UPSTASH_REDIS_REST_URL || ''
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  }

  async get(key: string): Promise<any> {
    if (!this.baseURL || !this.token) {
      logger.warn('Redis not configured, skipping cache get')
      return null
    }

    try {
      const response = await fetch(`${this.baseURL}/get/${key}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.result ? JSON.parse(data.result) : null
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.baseURL || !this.token) {
      logger.warn('Redis not configured, skipping cache set')
      return
    }

    try {
      const serialized = JSON.stringify(value)
      const endpoint = ttl ? `setex/${key}/${ttl}` : `set/${key}`
      
      await fetch(`${this.baseURL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: serialized })
      })
    } catch (error) {
      logger.error('Cache set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    if (!this.baseURL || !this.token) return

    try {
      await fetch(`${this.baseURL}/del/${key}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      logger.error('Cache delete error:', error)
    }
  }
}

export const cache = new SimpleCache()

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // If Redis is not configured, allow all requests
    return {
      allowed: true,
      remaining: limit - 1,
      reset: Date.now() + windowMs
    }
  }

  try {
    const now = Date.now()
    const window = Math.floor(now / windowMs)
    const rateLimitKey = `rate_limit:${key}:${window}`

    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/incr/${rateLimitKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return { allowed: true, remaining: limit - 1, reset: now + windowMs }
    }

    const data = await response.json()
    const count = data.result || 0

    if (count === 1) {
      // Set expiration on first request
      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/expire/${rateLimitKey}/${Math.ceil(windowMs / 1000)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
    }

    const allowed = count <= limit
    const remaining = Math.max(0, limit - count)
    const reset = (window + 1) * windowMs

    return { allowed, remaining, reset }
  } catch (error) {
    logger.error('Rate limit error:', error)
    return { allowed: true, remaining: limit - 1, reset: Date.now() + windowMs }
  }
}