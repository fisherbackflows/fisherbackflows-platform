import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const startTime = Date.now()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Test database connection
    const { error: dbError } = await supabase
      .from('customers')
      .select('id')
      .limit(1)

    const responseTime = Date.now() - startTime

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      services: {
        database: {
          status: dbError ? 'unhealthy' : 'healthy',
          error: dbError?.message
        },
        application: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          responseTime
        }
      }
    }

    // Return unhealthy status if any service is down
    if (health.services.database.status === 'unhealthy') {
      health.status = 'unhealthy'
      return NextResponse.json(health, { status: 503 })
    }

    return NextResponse.json(health, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message || 'Health check failed'
    }, { status: 503 })
  }
}