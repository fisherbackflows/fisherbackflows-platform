import { NextRequest, NextResponse } from 'next/server';
import { CacheMonitor, cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive cache health data
    const healthData = CacheMonitor.getHealthCheck();
    const stats = cache.getStats();
    
    // Calculate additional metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cache: {
        healthy: healthData.healthy,
        stats: {
          ...stats,
          hitRateFormatted: `${stats.hitRate.toFixed(2)}%`,
          evictionRate: stats.evictions > 0 ? (stats.evictions / stats.sets * 100).toFixed(2) + '%' : '0%'
        },
        recommendations: healthData.recommendations,
        performance: {
          avgAccessTime: 'N/A', // Could be implemented with timing
          hotKeys: 'N/A', // Could track most accessed keys
          efficiency: stats.size > 0 ? `${((stats.hits / stats.size) * 100).toFixed(1)}%` : '0%'
        }
      },
      server: {
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        }
      },
      alerts: [
        ...(stats.hitRate < 50 ? ['Low cache hit rate - consider increasing TTL'] : []),
        ...(stats.size > 1800 ? ['Cache size approaching limit'] : []),
        ...(stats.evictions > stats.sets * 0.1 ? ['High eviction rate detected'] : [])
      ]
    });
  } catch (error) {
    console.error('Cache health check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get cache health data' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'clear':
        cache.clear();
        return NextResponse.json({ 
          success: true, 
          message: 'Cache cleared successfully' 
        });
        
      case 'cleanup':
        const cleaned = cache.cleanup();
        return NextResponse.json({ 
          success: true, 
          message: `Cleaned ${cleaned} expired items` 
        });
        
      case 'stats':
        return NextResponse.json({ 
          success: true, 
          stats: cache.getStats() 
        });
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache management error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Cache management failed' 
    }, { status: 500 });
  }
}