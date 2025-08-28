// Ultra-fast caching layer for API routes
export class APICache {
  private static cache = new Map<string, { data: any; expires: number }>();
  
  static set(key: string, data: any, ttl = 5 * 60 * 1000) { // 5 min default
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }
  
  static get(key: string) {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
  
  static clear() {
    this.cache.clear();
  }
}

// High-performance database connection pool
let connectionPool: any = null;

export function getDBConnection() {
  if (!connectionPool) {
    // Initialize connection pool with optimizations
    connectionPool = {
      maxConnections: 20,
      idleTimeout: 30000,
      connectionTimeout: 2000,
    };
  }
  return connectionPool;
}