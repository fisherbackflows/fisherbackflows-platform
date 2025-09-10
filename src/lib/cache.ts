/**
 * Advanced Cache System - Fisher Backflows
 * High-performance caching for scheduling and availability data
 */

interface CacheItem<T = any> {
  value: T;
  expires: number;
  created: number;
  accessed: number;
  hits: number;
  tags: Set<string>;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  hitRate: number;
}

class AdvancedCache {
  private store = new Map<string, CacheItem>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  };
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 300000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Auto-cleanup every minute
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), 60000);
    }
  }

  set(key: string, value: any, ttlMs?: number, tags?: string[]): void {
    // Evict if at max capacity
    if (this.store.size >= this.maxSize) {
      this.evictLRU();
    }

    const now = Date.now();
    this.store.set(key, {
      value,
      expires: now + (ttlMs || this.defaultTTL),
      created: now,
      accessed: now,
      hits: 0,
      tags: new Set(tags || [])
    });
    
    this.stats.sets++;
  }

  get<T = any>(key: string): T | null {
    const item = this.store.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now > item.expires) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access metrics
    item.accessed = now;
    item.hits++;
    this.stats.hits++;
    
    return item.value as T;
  }

  delete(key: string): boolean {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  // Delete all items with a specific tag
  deleteByTag(tag: string): number {
    let deleted = 0;
    for (const [key, item] of this.store.entries()) {
      if (item.tags.has(tag)) {
        this.store.delete(key);
        deleted++;
      }
    }
    this.stats.deletes += deleted;
    return deleted;
  }

  // Delete multiple keys by pattern
  deleteByPattern(pattern: RegExp): number {
    let deleted = 0;
    for (const key of this.store.keys()) {
      if (pattern.test(key)) {
        this.store.delete(key);
        deleted++;
      }
    }
    this.stats.deletes += deleted;
    return deleted;
  }

  has(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.store.clear();
    this.stats.deletes += this.store.size;
  }

  // Get cache statistics
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.store.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  // Extend TTL for existing item
  extend(key: string, additionalMs: number): boolean {
    const item = this.store.get(key);
    if (!item) return false;
    
    item.expires += additionalMs;
    return true;
  }

  // Clean expired items
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.store.entries()) {
      if (now > item.expires) {
        this.store.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  // Evict least recently used item
  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Date.now();
    
    for (const [key, item] of this.store.entries()) {
      if (item.accessed < oldestAccess) {
        oldestAccess = item.accessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.store.delete(oldestKey);
      this.stats.evictions++;
    }
  }
}

// Cache key generators for different data types
export const CacheKeys = {
  // Availability caching
  availableDates: () => 'availability:dates',
  availableTimes: (date: string) => `availability:times:${date}`,
  availableSlots: (date: string, zone?: string) => 
    `availability:slots:${date}${zone ? `:${zone}` : ''}`,
  
  // Customer data
  customerAppointments: (customerId: string) => `customer:${customerId}:appointments`,
  customerDevices: (customerId: string) => `customer:${customerId}:devices`,
  customerBilling: (customerId: string) => `customer:${customerId}:billing`,
  
  // Zone-specific availability
  zoneAvailability: (zone: string, date: string) => `zone:${zone}:availability:${date}`,
  zoneCapacity: (zone: string, date: string) => `zone:${zone}:capacity:${date}`,
  
  // Scheduling optimization
  routeOptimization: (date: string) => `route:optimization:${date}`,
  techniciansAvailable: (date: string) => `technicians:available:${date}`,
  
  // Analytics and reporting
  dailyStats: (date: string) => `stats:daily:${date}`,
  weeklyMetrics: (week: string) => `metrics:weekly:${week}`,
  monthlyReport: (month: string) => `report:monthly:${month}`,
  
  // Business hours and configuration
  businessHours: (zone: string) => `config:business-hours:${zone}`,
  holidaySchedule: (year: number) => `config:holidays:${year}`,
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  VERY_SHORT: 30 * 1000,      // 30 seconds
  SHORT: 2 * 60 * 1000,       // 2 minutes
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 15 * 60 * 1000,       // 15 minutes
  VERY_LONG: 60 * 60 * 1000,  // 1 hour
  DAILY: 24 * 60 * 60 * 1000, // 24 hours
};

// Main cache instance
export const cache = new AdvancedCache(2000, CacheTTL.MEDIUM);

// Specialized cache utilities
export class AvailabilityCache {
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM,
    tags?: string[]
  ): Promise<T> {
    // Try cache first
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetcher();
    cache.set(key, data, ttl, tags);
    return data;
  }

  // Cache available dates with smart invalidation
  static async cacheAvailableDates(fetcher: () => Promise<any>): Promise<any> {
    return this.getOrSet(
      CacheKeys.availableDates(),
      fetcher,
      CacheTTL.MEDIUM,
      ['availability', 'dates']
    );
  }

  // Cache available times for a specific date
  static async cacheAvailableTimes(date: string, fetcher: () => Promise<any>): Promise<any> {
    return this.getOrSet(
      CacheKeys.availableTimes(date),
      fetcher,
      CacheTTL.SHORT,
      ['availability', 'times', `date:${date}`]
    );
  }

  // Cache zone-specific availability
  static async cacheZoneAvailability(
    zone: string,
    date: string,
    fetcher: () => Promise<any>
  ): Promise<any> {
    return this.getOrSet(
      CacheKeys.zoneAvailability(zone, date),
      fetcher,
      CacheTTL.SHORT,
      ['availability', 'zone', `zone:${zone}`, `date:${date}`]
    );
  }

  // Invalidate availability data when appointments change
  static invalidateAvailability(date?: string, zone?: string): void {
    if (date && zone) {
      // Specific date and zone
      cache.delete(CacheKeys.zoneAvailability(zone, date));
      cache.delete(CacheKeys.availableTimes(date));
    } else if (date) {
      // All zones for a specific date
      cache.deleteByTag(`date:${date}`);
    } else {
      // All availability data
      cache.deleteByTag('availability');
    }
  }

  // Warm cache with commonly requested data
  static async warmCache(): Promise<void> {
    if (typeof window !== 'undefined') return; // Only run on server
    
    try {
      const today = new Date();
      const dates = [];
      
      // Generate next 7 days
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Pre-cache availability for common requests
      console.log('Warming availability cache for next 7 days...');
      
      // This would integrate with your actual API endpoints
      // For now, just marking the cache slots as reserved
      dates.forEach(date => {
        cache.set(
          `cache:warming:${date}`,
          { warmed: true, date },
          CacheTTL.LONG,
          ['cache-warming']
        );
      });
      
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }
}

// Customer data caching
export class CustomerCache {
  static async cacheCustomerData<T>(
    customerId: string,
    dataType: 'appointments' | 'devices' | 'billing',
    fetcher: () => Promise<T>
  ): Promise<T> {
    const key = dataType === 'appointments' 
      ? CacheKeys.customerAppointments(customerId)
      : dataType === 'devices'
      ? CacheKeys.customerDevices(customerId)
      : CacheKeys.customerBilling(customerId);

    return AvailabilityCache.getOrSet(
      key,
      fetcher,
      CacheTTL.MEDIUM,
      ['customer', `customer:${customerId}`, dataType]
    );
  }

  static invalidateCustomerData(customerId: string, dataType?: string): void {
    if (dataType) {
      cache.deleteByTag(`customer:${customerId}`);
    } else {
      cache.deleteByTag(`customer:${customerId}`);
    }
  }
}

// Performance monitoring
export class CacheMonitor {
  static logStats(): void {
    const stats = cache.getStats();
    console.log('Cache Performance:', {
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      size: stats.size,
      hits: stats.hits,
      misses: stats.misses
    });
  }

  static getHealthCheck(): any {
    const stats = cache.getStats();
    return {
      healthy: stats.hitRate > 50 && stats.size < 1800,
      stats,
      recommendations: stats.hitRate < 50 
        ? ['Consider longer TTL for frequently accessed data']
        : stats.size > 1800
        ? ['Cache size approaching limit, consider cleanup']
        : ['Cache performance is optimal']
    };
  }
}

// Auto-warm cache on server startup
if (typeof window === 'undefined') {
  // Warm cache after 5 seconds on startup
  setTimeout(() => {
    AvailabilityCache.warmCache().catch(console.error);
  }, 5000);
  
  // Log cache stats every 10 minutes
  setInterval(() => {
    CacheMonitor.logStats();
  }, 600000);
}