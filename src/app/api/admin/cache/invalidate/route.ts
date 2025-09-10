import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityCache, CustomerCache, cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const { type, target, pattern } = await request.json();
    
    let invalidated = 0;
    let message = '';
    
    switch (type) {
      case 'availability':
        if (target === 'all') {
          AvailabilityCache.invalidateAvailability();
          message = 'All availability cache invalidated';
        } else if (target) {
          AvailabilityCache.invalidateAvailability(target);
          message = `Availability cache invalidated for date: ${target}`;
        }
        break;
        
      case 'customer':
        if (target) {
          CustomerCache.invalidateCustomerData(target);
          message = `Customer cache invalidated for ID: ${target}`;
        }
        break;
        
      case 'tag':
        if (target) {
          invalidated = cache.deleteByTag(target);
          message = `Invalidated ${invalidated} items with tag: ${target}`;
        }
        break;
        
      case 'pattern':
        if (pattern) {
          try {
            const regex = new RegExp(pattern);
            invalidated = cache.deleteByPattern(regex);
            message = `Invalidated ${invalidated} items matching pattern: ${pattern}`;
          } catch (err) {
            return NextResponse.json({ 
              error: 'Invalid regex pattern' 
            }, { status: 400 });
          }
        }
        break;
        
      case 'key':
        if (target) {
          const deleted = cache.delete(target);
          message = deleted 
            ? `Cache key deleted: ${target}`
            : `Cache key not found: ${target}`;
        }
        break;
        
      case 'expired':
        invalidated = cache.cleanup();
        message = `Cleaned up ${invalidated} expired cache items`;
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid invalidation type' 
        }, { status: 400 });
    }
    
    // Log cache action for audit
    console.log(`Cache invalidation: ${message}`);
    
    return NextResponse.json({
      success: true,
      message,
      invalidated,
      timestamp: new Date().toISOString(),
      cacheStats: cache.getStats()
    });
    
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Cache invalidation failed' 
    }, { status: 500 });
  }
}

// Get current cache contents for debugging
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyPattern = searchParams.get('pattern');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const stats = cache.getStats();
    const keys = [];
    
    // Get cache keys for inspection (limited for performance)
    let count = 0;
    for (const [key] of (cache as any).store.entries()) {
      if (count >= limit) break;
      
      if (!keyPattern || key.includes(keyPattern)) {
        keys.push({
          key,
          hasValue: cache.has(key),
          created: 'N/A', // Could expose if needed
          accessed: 'N/A'
        });
        count++;
      }
    }
    
    return NextResponse.json({
      success: true,
      stats,
      keys,
      totalKeys: (cache as any).store.size,
      showing: keys.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache inspection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Cache inspection failed' 
    }, { status: 500 });
  }
}