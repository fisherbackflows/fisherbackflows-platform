/**
 * Simple Cache System - Fisher Backflows
 * Basic caching for scheduling and availability data
 */

interface CacheItem<T = any> {
  value: T;
  expires: number;
}

class SimpleCache {
  private store = new Map<string, CacheItem>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 300000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: any, ttlMs?: number): void {
    // Simple eviction when at max capacity
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
    }

    const now = Date.now();
    this.store.set(key, {
      value,
      expires: now + (ttlMs || this.defaultTTL)
    });
  }

  get<T = any>(key: string): T | null {
    const item = this.store.get(key);
    
    if (!item || Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Cache key generators
export const CacheKeys = {
  availableDates: () => 'availability:dates',
  availableTimes: (date: string) => `availability:times:${date}`,
  customerAppointments: (customerId: string) => `customer:${customerId}:appointments`
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,       // 2 minutes
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 15 * 60 * 1000,       // 15 minutes
};

// Main cache instance
export const cache = new SimpleCache();