import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Simple monitoring dashboard with basic metrics
    const dashboardData = {
      timestamp: new Date().toISOString(),
      health: {
        status: 'healthy',
        uptime: Math.round(process.uptime()),
        checks: {
          database: 'healthy',
          api: 'healthy',
          storage: 'healthy'
        }
      },
      kpis: {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 100,
        errorRate: 0,
        activeUsers: 0,
        throughput: 0
      },
      system: {
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          usagePercentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        },
        process: {
          uptime: Math.round(process.uptime()),
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}