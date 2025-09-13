/**
 * Database-Specific Health Check Endpoint
 * Provides detailed database connectivity and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

interface DatabaseHealthDetail {
  connectivity: {
    status: 'connected' | 'disconnected'
    responseTime: number
  }
  tables: {
    name: string
    accessible: boolean
    recordCount?: number
    responseTime: number
  }[]
  performance: {
    avgQueryTime: number
    slowQueries: number
    connectionPool: {
      active?: number
      idle?: number
      total?: number
    }
  }
  rls: {
    enabled: boolean
    policiesActive: number
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestStart = Date.now()
  const requestId = crypto.randomUUID()

  try {
    logger.info('Database health check requested', { requestId })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Database configuration missing',
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 503 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const healthDetails: DatabaseHealthDetail = {
      connectivity: { status: 'disconnected', responseTime: 0 },
      tables: [],
      performance: { avgQueryTime: 0, slowQueries: 0, connectionPool: {} },
      rls: { enabled: false, policiesActive: 0 }
    }

    // Test basic connectivity
    const connectStart = Date.now()
    try {
      const { data, error } = await supabase.from('customers').select('id').limit(1)
      
      healthDetails.connectivity = {
        status: error ? 'disconnected' : 'connected',
        responseTime: Date.now() - connectStart
      }

      if (error) throw error
    } catch (error) {
      return NextResponse.json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connectivity failed',
        details: healthDetails,
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 503 })
    }

    // Test key tables accessibility
    const tablesToCheck = ['customers', 'work_orders', 'inspections', 'team_users']
    
    const tableChecks = await Promise.allSettled(
      tablesToCheck.map(async (tableName) => {
        const tableStart = Date.now()
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('id', { count: 'exact', head: true })

          if (error) throw error

          return {
            name: tableName,
            accessible: true,
            recordCount: count || 0,
            responseTime: Date.now() - tableStart
          }
        } catch (error) {
          return {
            name: tableName,
            accessible: false,
            responseTime: Date.now() - tableStart,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    healthDetails.tables = tableChecks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        name: 'unknown',
        accessible: false,
        responseTime: 0
      }
    )

    // Calculate performance metrics
    const responseTimes = healthDetails.tables
      .filter(t => t.accessible)
      .map(t => t.responseTime)

    healthDetails.performance.avgQueryTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0

    healthDetails.performance.slowQueries = responseTimes.filter(t => t > 1000).length

    // Check RLS policies (simplified check)
    try {
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('schemaname, tablename, policyname')
        .eq('schemaname', 'public')

      healthDetails.rls = {
        enabled: true,
        policiesActive: policies?.length || 0
      }
    } catch (error) {
      logger.warn('Could not check RLS policies', { error })
      healthDetails.rls = {
        enabled: false,
        policiesActive: 0
      }
    }

    const totalResponseTime = Date.now() - requestStart

    // Determine overall health status
    const hasUnhealthyTables = healthDetails.tables.some(t => !t.accessible)
    const hasSlowPerformance = healthDetails.performance.avgQueryTime > 2000
    const isConnected = healthDetails.connectivity.status === 'connected'

    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (!isConnected || hasUnhealthyTables) {
      status = 'unhealthy'
    } else if (hasSlowPerformance) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }

    logger.info('Database health check completed', {
      requestId,
      status,
      responseTime: totalResponseTime,
      tablesAccessible: healthDetails.tables.filter(t => t.accessible).length,
      avgQueryTime: healthDetails.performance.avgQueryTime
    })

    const httpStatus = status === 'unhealthy' ? 503 : 200

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      details: healthDetails,
      requestId
    }, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Response-Time': totalResponseTime.toString()
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Database health check failed'
    
    logger.error('Database health check error', {
      requestId,
      error: errorMessage,
      responseTime: Date.now() - requestStart
    })

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      requestId
    }, { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    })
  }
}