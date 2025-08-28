import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check environment variables first
    const envCheck = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing'
    }

    let dbError = null
    let dbStatus = 'unknown'
    
    try {
      const supabase = createRouteHandlerClient(request)
      
      // Test database connection with actual tables
      const { error } = await supabase
        .from('team_users')
        .select('id')
        .limit(1)
        
      dbError = error
      dbStatus = error ? 'unhealthy' : 'healthy'
      
    } catch (clientError) {
      dbError = clientError
      dbStatus = 'client_error'
    }

    const responseTime = Date.now() - startTime

    const health = {
      status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      config: envCheck,
      services: {
        database: {
          status: dbStatus,
          error: dbError?.message,
          details: dbError ? {
            code: dbError.code,
            hint: dbError.hint
          } : null
        },
        application: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          responseTime
        }
      }
    }

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503
    return NextResponse.json(health, { status: statusCode })

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message || 'Health check failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 503 })
  }
}