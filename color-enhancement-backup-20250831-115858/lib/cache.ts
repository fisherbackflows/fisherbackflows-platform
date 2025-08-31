/**
 * Simple Cache - Fisher Backflows
 * In-memory caching for performance
 */

interface CacheItem {
  value: any;
  expires: number;
}

class SimpleCache {
  private store = new Map<string, CacheItem>();

  set(key: string, value: any, ttlSeconds = 300) {
    this.store.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  get(key: string): any {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  // Clean expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expires) {
        this.store.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// Cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => cache.cleanup(), 300000);
}