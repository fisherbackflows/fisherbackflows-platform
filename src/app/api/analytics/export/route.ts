import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase'
import { AnalyticsEngine } from '@/lib/analytics/metrics'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Verify authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json, csv, xlsx
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeCustomers = searchParams.get('includeCustomers') === 'true'
    const includeForecasts = searchParams.get('includeForecasts') === 'true'

    const analytics = new AnalyticsEngine(request)

    // Gather all analytics data
    const exportData: any = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.email,
        dateRange: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        },
        format,
        includeCustomers,
        includeForecasts
      }
    }

    // Core business metrics
    exportData.businessMetrics = await analytics.calculateBusinessMetrics(startDate || undefined, endDate || undefined)
    
    // Time series data
    exportData.timeSeriesData = await analytics.getTimeSeriesData(30)
    
    // Operational insights
    exportData.insights = await analytics.getOperationalInsights()

    // Optional: Customer analytics
    if (includeCustomers) {
      exportData.topCustomers = await analytics.getTopCustomers(50)
    }

    // Optional: Revenue forecasts
    if (includeForecasts) {
      exportData.revenueForecast = await analytics.getRevenueForecast(6)
    }

    // Format response based on requested format
    switch (format) {
      case 'csv':
        return generateCSVResponse(exportData)
      case 'xlsx':
        return generateExcelResponse(exportData)
      case 'json':
      default:
        return NextResponse.json(exportData, {
          headers: {
            'Content-Disposition': `attachment; filename="fisher-backflows-analytics-${new Date().toISOString().split('T')[0]}.json"`,
            'Content-Type': 'application/json'
          }
        })
    }

  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function generateCSVResponse(data: any) {
  // Convert time series data to CSV
  let csvContent = 'Date,Revenue,Appointments,New Customers,Tests Completed\n'
  
  data.timeSeriesData.forEach((row: any) => {
    csvContent += `${row.date},${row.revenue},${row.appointments},${row.newCustomers},${row.testsCompleted}\n`
  })

  // Add business metrics summary
  csvContent += '\n\nBusiness Metrics Summary\n'
  csvContent += 'Metric,Value\n'
  csvContent += `Total Revenue,${data.businessMetrics.revenue.total}\n`
  csvContent += `Total Customers,${data.businessMetrics.customers.total}\n`
  csvContent += `Active Customers,${data.businessMetrics.customers.active}\n`
  csvContent += `Completion Rate,${data.businessMetrics.appointments.completionRate}%\n`
  csvContent += `Test Pass Rate,${data.businessMetrics.tests.passRate}%\n`

  // Add customer data if included
  if (data.topCustomers) {
    csvContent += '\n\nTop Customers\n'
    csvContent += 'Name,Email,Total Spent,Appointment Count,Risk Score\n'
    data.topCustomers.forEach((customer: any) => {
      csvContent += `"${customer.name}","${customer.email}",${customer.totalSpent},${customer.appointmentCount},${customer.riskScore}\n`
    })
  }

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="fisher-backflows-analytics-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

function generateExcelResponse(data: any) {
  // For now, return JSON with Excel MIME type
  // In a full implementation, you'd use a library like exceljs
  const jsonContent = JSON.stringify(data, null, 2)
  
  return new NextResponse(jsonContent, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="fisher-backflows-analytics-${new Date().toISOString().split('T')[0]}.xlsx"`
    }
  })
}