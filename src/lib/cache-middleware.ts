/**
 * Cache Middleware - Fisher Backflows
 * Automatic cache header management and response optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache, CacheKeys, CacheTTL } from './cache';

interface CacheConfig {
  ttl?: number;
  tags?: string[];
  revalidate?: number;
  staleWhileRevalidate?: number;
  public?: boolean;
}

// Default cache configurations for different route patterns
const ROUTE_CACHE_CONFIGS: Record<string, CacheConfig> = {
  '/api/appointments/available-dates': {
    ttl: CacheTTL.MEDIUM,
    tags: ['availability', 'dates'],
    revalidate: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
    public: true
  },
  '/api/appointments/available-times': {
    ttl: CacheTTL.SHORT,
    tags: ['availability', 'times'],
    revalidate: 120, // 2 minutes
    staleWhileRevalidate: 300, // 5 minutes
    public: true
  },
  '/api/calendar/available-dates': {
    ttl: CacheTTL.LONG,
    tags: ['calendar', 'availability'],
    revalidate: 900, // 15 minutes
    staleWhileRevalidate: 1800, // 30 minutes
    public: true
  }
};

export class CacheMiddleware {
  /**
   * Add appropriate cache headers to response
   */
  static addCacheHeaders(
    response: NextResponse,
    config: CacheConfig
  ): NextResponse {
    const headers = new Headers(response.headers);
    
    if (config.public) {
      headers.set('Cache-Control', 
        `public, max-age=${config.revalidate || 300}, stale-while-revalidate=${config.staleWhileRevalidate || 600}`
      );
    } else {
      headers.set('Cache-Control', 'private, no-cache');
    }
    
    // Add ETag for better cache validation
    const etag = this.generateETag(response);
    if (etag) {
      headers.set('ETag', etag);
    }
    
    // Add cache status header for debugging
    headers.set('X-Cache-Config', JSON.stringify({
      ttl: config.ttl,
      tags: config.tags,
      revalidate: config.revalidate
    }));
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  /**
   * Generate ETag from response content
   */
  private static generateETag(response: NextResponse): string | null {
    try {
      // Simple hash of response for ETag
      const content = JSON.stringify(response);
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return `"${Math.abs(hash).toString(16)}"`;
    } catch {
      return null;
    }
  }

  /**
   * Handle conditional requests (If-None-Match, If-Modified-Since)
   */
  static handleConditionalRequest(
    request: NextRequest,
    etag?: string,
    lastModified?: Date
  ): NextResponse | null {
    const ifNoneMatch = request.headers.get('If-None-Match');
    const ifModifiedSince = request.headers.get('If-Modified-Since');
    
    // Check ETag
    if (ifNoneMatch && etag && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }
    
    // Check Last-Modified
    if (ifModifiedSince && lastModified) {
      const ifModifiedSinceDate = new Date(ifModifiedSince);
      if (lastModified <= ifModifiedSinceDate) {
        return new NextResponse(null, { status: 304 });
      }
    }
    
    return null;
  }

  /**
   * Wrap API route with caching logic
   */
  static withCache<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T,
    config?: CacheConfig
  ): T {
    return (async (...args: any[]) => {
      const request = args[0] as NextRequest;
      const pathname = new URL(request.url).pathname;
      
      // Get cache config for this route
      const routeConfig = config || ROUTE_CACHE_CONFIGS[pathname] || {};
      
      // Handle conditional requests
      const conditionalResponse = this.handleConditionalRequest(request);
      if (conditionalResponse) {
        return conditionalResponse;
      }
      
      // Execute original handler
      const response = await handler(...args);
      
      // Add cache headers if successful
      if (response.ok) {
        return this.addCacheHeaders(response, routeConfig);
      }
      
      return response;
    }) as T;
  }

  /**
   * Cache response data with automatic key generation
   */
  static async cacheResponse<T>(
    request: NextRequest,
    fetcher: () => Promise<T>,
    config?: CacheConfig
  ): Promise<T> {
    const url = new URL(request.url);
    const cacheKey = `response:${url.pathname}:${url.search}`;
    
    // Try cache first
    const cached = cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Fetch and cache
    const data = await fetcher();
    cache.set(cacheKey, data, config?.ttl, config?.tags);
    
    return data;
  }

  /**
   * Invalidate cached responses by pattern
   */
  static invalidateResponses(pattern: string): number {
    return cache.deleteByPattern(new RegExp(`response:.*${pattern}.*`));
  }
}

// Export convenience functions
export const withCache = CacheMiddleware.withCache.bind(CacheMiddleware);
export const cacheResponse = CacheMiddleware.cacheResponse.bind(CacheMiddleware);
export const addCacheHeaders = CacheMiddleware.addCacheHeaders.bind(CacheMiddleware);

// Cache warming utilities
export class CacheWarmer {
  /**
   * Warm frequently accessed endpoints
   */
  static async warmFrequentRoutes(): Promise<void> {
    if (typeof window !== 'undefined') return; // Server-side only
    
    try {
      console.log('🔥 Warming cache for frequent routes...');
      
      // Warm availability data for next 7 days
      const today = new Date();
      const warmingPromises = [];
      
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Pre-warm availability data
        warmingPromises.push(
          cache.set(
            CacheKeys.availableTimes(dateStr),
            { warmed: true, date: dateStr },
            CacheTTL.MEDIUM,
            ['availability', 'warmed', `date:${dateStr}`]
          )
        );
      }
      
      await Promise.all(warmingPromises);
      console.log('✅ Cache warming completed');
      
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }

  /**
   * Schedule regular cache warming
   */
  static scheduleWarming(): void {
    if (typeof window !== 'undefined') return;
    
    // Warm cache every 30 minutes
    setInterval(() => {
      this.warmFrequentRoutes().catch(console.error);
    }, 30 * 60 * 1000);
    
    // Initial warming after 10 seconds
    setTimeout(() => {
      this.warmFrequentRoutes().catch(console.error);
    }, 10000);
  }
}

// Auto-start cache warming on server
if (typeof window === 'undefined') {
  CacheWarmer.scheduleWarming();
}