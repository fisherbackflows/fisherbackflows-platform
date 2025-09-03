import { NextResponse } from 'next/server'
import { AIMonitoringSystem } from '@/lib/ai/AIMonitoring'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'health'
    const timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h'
    const system = searchParams.get('system')

    const monitoringSystem = new AIMonitoringSystem()

    switch (reportType) {
      case 'health':
        const healthReport = await monitoringSystem.getSystemHealthReport()
        return NextResponse.json({
          success: true,
          report: healthReport,
          timestamp: new Date().toISOString()
        })

      case 'models':
        const modelPerformance = await monitoringSystem.getModelPerformance(system || undefined)
        return NextResponse.json({
          success: true,
          models: modelPerformance,
          timestamp: new Date().toISOString()
        })

      case 'detailed':
        const detailedReport = await monitoringSystem.generateDetailedReport(timeRange)
        return NextResponse.json({
          success: true,
          report: detailedReport,
          timeRange,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type. Use: health, models, or detailed' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('AI monitoring API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate monitoring report',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, data } = body

    const monitoringSystem = new AIMonitoringSystem()

    switch (action) {
      case 'create_alert':
        const { systemName, alertType, severity, message, metrics } = data
        
        if (!systemName || !alertType || !severity || !message) {
          return NextResponse.json(
            { success: false, error: 'Missing required alert parameters' },
            { status: 400 }
          )
        }

        const alert = await monitoringSystem.createAlert(
          systemName,
          alertType,
          severity,
          message,
          metrics || {}
        )

        return NextResponse.json({
          success: true,
          alert,
          message: 'Alert created successfully'
        })

      case 'schedule_maintenance':
        const { systemName: maintSystemName, maintenanceType, scheduledTime } = data
        
        if (!maintSystemName || !maintenanceType || !scheduledTime) {
          return NextResponse.json(
            { success: false, error: 'Missing required maintenance parameters' },
            { status: 400 }
          )
        }

        const maintenanceResult = await monitoringSystem.scheduleSystemMaintenance(
          maintSystemName,
          maintenanceType,
          scheduledTime
        )

        return NextResponse.json({
          success: true,
          maintenance: maintenanceResult,
          message: 'Maintenance scheduled successfully'
        })

      case 'system_check':
        const healthReport = await monitoringSystem.getSystemHealthReport()
        const criticalSystems = healthReport.systems.filter(s => s.status === 'down' || s.status === 'degraded')
        
        return NextResponse.json({
          success: true,
          status: healthReport.overall.status,
          criticalSystems,
          recommendations: healthReport.recommendations.slice(0, 3), // Top 3 recommendations
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('AI monitoring POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process monitoring request',
        details: error.message 
      },
      { status: 500 }
    )
  }
}