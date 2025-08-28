// High-performance caching system for Fisher Backflows
import { createClient } from '@/lib/supabase/client'
import { logger } from './logger'

export interface CacheEntry<T = any> {
  key: string
  value: T
  expiresAt: number
  createdAt: number
  accessCount: number
  lastAccessed: number
  tags: string[]
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[] // Tags for cache invalidation
  refresh?: boolean // Force refresh from source
  compress?: boolean // Compress large values
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalKeys: number
  memoryUsage: number
  evictions: number
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    memoryUsage: 0,
    evictions: 0
  }
  private maxMemorySize = 50 * 1024 * 1024 // 50MB
  private maxEntries = 10000
  private cleanupInterval: NodeJS.Timeout | null = null
  private supabase = createClient()

  constructor() {
    this.startCleanupProcess()
    this.startStatsReporting()
  }

  // Get value from cache with fallback to database
  async get<T>(
    key: string, 
    fallback?: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const startTime = performance.now()
    
    try {
      // Check memory cache first
      let entry = this.memoryCache.get(key)
      
      if (entry && !this.isExpired(entry) && !options.refresh) {
        entry.accessCount++
        entry.lastAccessed = Date.now()
        this.stats.hits++
        this.updateHitRate()
        
        await logger.debug(`Cache hit for key: ${key}`, {
          accessCount: entry.accessCount,
          age: Date.now() - entry.createdAt,
          responseTime: performance.now() - startTime
        })
        
        return entry.value
      }

      // Cache miss - try database cache
      if (!options.refresh) {
        const dbEntry = await this.getFromDatabase(key)
        if (dbEntry && !this.isExpired(dbEntry)) {
          // Restore to memory cache
          this.memoryCache.set(key, dbEntry)
          this.stats.hits++
          this.updateHitRate()
          
          await logger.debug(`Database cache hit for key: ${key}`)
          return dbEntry.value
        }
      }

      this.stats.misses++
      this.updateHitRate()

      // Execute fallback if provided
      if (fallback) {
        const value = await fallback()
        if (value !== null && value !== undefined) {
          await this.set(key, value, options)
          
          await logger.debug(`Cache populated via fallback for key: ${key}`, {
            responseTime: performance.now() - startTime
          })
          
          return value
        }
      }

      await logger.debug(`Cache miss for key: ${key}`, {
        responseTime: performance.now() - startTime
      })

      return null

    } catch (error) {
      await logger.error(`Cache get failed for key: ${key}`, error)
      return fallback ? await fallback() : null
    }
  }

  // Set value in cache
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || 3600000 // 1 hour default
      const now = Date.now()
      
      const entry: CacheEntry<T> = {
        key,
        value,
        expiresAt: now + ttl,
        createdAt: now,
        accessCount: 0,
        lastAccessed: now,
        tags: options.tags || []
      }

      // Memory cache
      this.memoryCache.set(key, entry)
      this.stats.totalKeys = this.memoryCache.size

      // Database cache for persistence
      await this.saveToDatabase(entry)

      // Trigger cleanup if needed
      await this.enforceMemoryLimits()

      await logger.debug(`Cache set for key: ${key}`, {
        ttl,
        tags: options.tags,
        valueSize: this.getValueSize(value)
      })

    } catch (error) {
      await logger.error(`Cache set failed for key: ${key}`, error)
    }
  }

  // Delete specific key
  async delete(key: string): Promise<boolean> {
    try {
      const memoryDeleted = this.memoryCache.delete(key)
      await this.deleteFromDatabase(key)
      
      this.stats.totalKeys = this.memoryCache.size
      
      await logger.debug(`Cache delete for key: ${key}`, { found: memoryDeleted })
      return memoryDeleted

    } catch (error) {
      await logger.error(`Cache delete failed for key: ${key}`, error)
      return false
    }
  }

  // Clear cache by tags
  async clearByTag(tag: string): Promise<number> {
    let cleared = 0
    
    try {
      // Clear from memory
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags.includes(tag)) {
          this.memoryCache.delete(key)
          cleared++
        }
      }

      // Clear from database
      await this.clearDatabaseByTag(tag)
      
      this.stats.totalKeys = this.memoryCache.size
      
      await logger.info(`Cache cleared by tag: ${tag}`, { cleared })
      return cleared

    } catch (error) {
      await logger.error(`Cache clear by tag failed: ${tag}`, error)
      return cleared
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear()
      await this.clearDatabase()
      
      this.stats.totalKeys = 0
      this.stats.evictions = 0
      
      await logger.info('Cache cleared completely')

    } catch (error) {
      await logger.error('Cache clear failed', error)
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return {
      ...this.stats,
      memoryUsage: this.calculateMemoryUsage()
    }
  }

  // Cache warming for common queries
  async warm(): Promise<void> {
    try {
      await logger.info('Starting cache warming...')

      const warmingTasks = [
        this.warmCustomerData(),
        this.warmDeviceData(),
        this.warmMetricsData(),
        this.warmAnalyticsData()
      ]

      await Promise.allSettled(warmingTasks)
      
      await logger.info('Cache warming completed', {
        totalKeys: this.stats.totalKeys,
        memoryUsage: this.calculateMemoryUsage()
      })

    } catch (error) {
      await logger.error('Cache warming failed', error)
    }
  }

  // Business-specific cache methods
  async cacheCustomer(customerId: string, refresh = false): Promise<any> {
    return this.get(
      `customer:${customerId}`,
      async () => {
        const { data } = await this.supabase
          .from('customers')
          .select(`
            *,
            devices (*),
            appointments (*),
            invoices (*)
          `)
          .eq('id', customerId)
          .single()
        return data
      },
      { 
        ttl: 1800000, // 30 minutes
        tags: ['customers', `customer:${customerId}`],
        refresh 
      }
    )
  }

  async cacheMetrics(period: string, refresh = false): Promise<any> {
    return this.get(
      `metrics:${period}`,
      async () => {
        const response = await fetch(`/api/admin/metrics?period=${period}`)
        return response.json()
      },
      {
        ttl: 300000, // 5 minutes
        tags: ['metrics', 'dashboard'],
        refresh
      }
    )
  }

  async cacheAnalytics(period: string, refresh = false): Promise<any> {
    return this.get(
      `analytics:${period}`,
      async () => {
        const response = await fetch(`/api/admin/analytics?period=${period}`)
        return response.json()
      },
      {
        ttl: 1800000, // 30 minutes
        tags: ['analytics', 'reports'],
        refresh
      }
    )
  }

  // Private helper methods
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt
  }

  private async getFromDatabase(key: string): Promise<CacheEntry | null> {
    try {
      const { data } = await this.supabase
        .from('cache_entries')
        .select('*')
        .eq('key', key)
        .single()

      if (data) {
        return {
          key: data.key,
          value: JSON.parse(data.value),
          expiresAt: new Date(data.expires_at).getTime(),
          createdAt: new Date(data.created_at).getTime(),
          accessCount: data.access_count || 0,
          lastAccessed: new Date(data.last_accessed).getTime(),
          tags: data.tags || []
        }
      }

      return null

    } catch (error) {
      await logger.warn(`Database cache read failed for key: ${key}`, error)
      return null
    }
  }

  private async saveToDatabase(entry: CacheEntry): Promise<void> {
    try {
      await this.supabase
        .from('cache_entries')
        .upsert({
          key: entry.key,
          value: JSON.stringify(entry.value),
          expires_at: new Date(entry.expiresAt).toISOString(),
          created_at: new Date(entry.createdAt).toISOString(),
          access_count: entry.accessCount,
          last_accessed: new Date(entry.lastAccessed).toISOString(),
          tags: entry.tags
        })

    } catch (error) {
      await logger.warn(`Database cache write failed for key: ${entry.key}`, error)
    }
  }

  private async deleteFromDatabase(key: string): Promise<void> {
    try {
      await this.supabase
        .from('cache_entries')
        .delete()
        .eq('key', key)

    } catch (error) {
      await logger.warn(`Database cache delete failed for key: ${key}`, error)
    }
  }

  private async clearDatabaseByTag(tag: string): Promise<void> {
    try {
      await this.supabase
        .from('cache_entries')
        .delete()
        .contains('tags', [tag])

    } catch (error) {
      await logger.warn(`Database cache clear by tag failed: ${tag}`, error)
    }
  }

  private async clearDatabase(): Promise<void> {
    try {
      await this.supabase
        .from('cache_entries')
        .delete()
        .neq('key', '') // Delete all

    } catch (error) {
      await logger.warn('Database cache clear failed', error)
    }
  }

  private async enforceMemoryLimits(): Promise<void> {
    if (this.memoryCache.size <= this.maxEntries && this.calculateMemoryUsage() <= this.maxMemorySize) {
      return
    }

    // LRU eviction
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    const targetSize = Math.floor(this.maxEntries * 0.8)
    const toEvict = entries.slice(0, entries.length - targetSize)

    for (const [key] of toEvict) {
      this.memoryCache.delete(key)
      this.stats.evictions++
    }

    this.stats.totalKeys = this.memoryCache.size
    
    if (toEvict.length > 0) {
      await logger.info(`Evicted ${toEvict.length} cache entries`, {
        newSize: this.stats.totalKeys,
        memoryUsage: this.calculateMemoryUsage()
      })
    }
  }

  private calculateMemoryUsage(): number {
    let size = 0
    for (const entry of this.memoryCache.values()) {
      size += this.getValueSize(entry.value) + 200 // Approximate overhead
    }
    return size
  }

  private getValueSize(value: any): number {
    return JSON.stringify(value).length * 2 // Approximate UTF-16 size
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      let cleaned = 0
      const now = Date.now()

      // Remove expired entries
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key)
          cleaned++
        }
      }

      if (cleaned > 0) {
        this.stats.totalKeys = this.memoryCache.size
        await logger.debug(`Cleaned ${cleaned} expired cache entries`)
      }

      // Cleanup database
      await this.cleanupDatabase()

    }, 300000) // 5 minutes
  }

  private async cleanupDatabase(): Promise<void> {
    try {
      await this.supabase
        .from('cache_entries')
        .delete()
        .lt('expires_at', new Date().toISOString())

    } catch (error) {
      await logger.warn('Database cache cleanup failed', error)
    }
  }

  private startStatsReporting(): void {
    setInterval(async () => {
      const stats = this.getStats()
      await logger.logPerformanceMetric('cache-hit-rate', stats.hitRate)
      await logger.logPerformanceMetric('cache-memory-usage', stats.memoryUsage)
      await logger.logPerformanceMetric('cache-total-keys', stats.totalKeys)
    }, 600000) // 10 minutes
  }

  // Cache warming methods
  private async warmCustomerData(): Promise<void> {
    try {
      const { data: customers } = await this.supabase
        .from('customers')
        .select('id')
        .eq('status', 'active')
        .limit(50)

      const promises = customers?.map(c => this.cacheCustomer(c.id)) || []
      await Promise.allSettled(promises)

    } catch (error) {
      await logger.warn('Customer cache warming failed', error)
    }
  }

  private async warmDeviceData(): Promise<void> {
    try {
      const { data: devices } = await this.supabase
        .from('devices')
        .select('*')
        .limit(100)

      if (devices) {
        await this.set('devices:all', devices, {
          ttl: 1800000,
          tags: ['devices']
        })
      }

    } catch (error) {
      await logger.warn('Device cache warming failed', error)
    }
  }

  private async warmMetricsData(): Promise<void> {
    const periods = ['7days', '30days', '90days']
    const promises = periods.map(period => this.cacheMetrics(period))
    await Promise.allSettled(promises)
  }

  private async warmAnalyticsData(): Promise<void> {
    const periods = ['3months', '6months', '12months']
    const promises = periods.map(period => this.cacheAnalytics(period))
    await Promise.allSettled(promises)
  }

  // Cleanup on destroy
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Create singleton instance
export const cache = new CacheManager()

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator(...args)
      
      return cache.get(
        key,
        () => originalMethod.apply(this, args),
        options
      )
    }

    return descriptor
  }
}

// Cleanup on app shutdown
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cache.destroy()
  })
}