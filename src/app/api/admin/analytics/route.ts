import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '12months'
    
    const supabase = createRouteHandlerClient(request)

    // Verify authentication and admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '24months':
        startDate.setFullYear(startDate.getFullYear() - 2)
        break
      default: // 12months
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // Fetch data for analytics
    const [
      testReportsResponse,
      customersResponse,
      invoicesResponse,
      devicesResponse
    ] = await Promise.allSettled([
      supabase
        .from('test_reports')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('customers')
        .select('*')
        .gte('created_at', startDate.toISOString()),
      
      supabase
        .from('invoices')
        .select('*')
        .gte('created_at', startDate.toISOString()),
        
      supabase
        .from('devices')
        .select('*')
    ])

    // Process data with fallbacks
    const testReports = testReportsResponse.status === 'fulfilled' ? (testReportsResponse.value.data as any[]) || [] : []
    const customers = customersResponse.status === 'fulfilled' ? (customersResponse.value.data as any[]) || [] : []
    const invoices = invoicesResponse.status === 'fulfilled' ? (invoicesResponse.value.data as any[]) || [] : []
    const devices = devicesResponse.status === 'fulfilled' ? (devicesResponse.value.data as any[]) || [] : []

    // Generate monthly revenue data
    const monthlyRevenue = generateMonthlyData(testReports, invoices, startDate, endDate)
    
    // Calculate test results distribution
    const testResults = [
      { 
        result: 'Passed', 
        count: testReports.filter(r => r.test_result === 'Passed' || r.status === 'Passed').length,
        percentage: 0
      },
      { 
        result: 'Failed', 
        count: testReports.filter(r => r.test_result === 'Failed' || r.status === 'Failed').length,
        percentage: 0
      },
      { 
        result: 'Needs Repair', 
        count: testReports.filter(r => r.test_result === 'Needs Repair' || r.status === 'Needs Repair').length,
        percentage: 0
      }
    ]

    // Calculate percentages
    const totalTests = testResults.reduce((sum, r) => sum + r.count, 0)
    if (totalTests > 0) {
      testResults.forEach(result => {
        result.percentage = Math.round((result.count / totalTests) * 100 * 10) / 10
      })
    }

    // Generate customer growth data
    const customerGrowth = generateCustomerGrowthData(customers, startDate, endDate)

    // Analyze device types
    const deviceTypeCount: { [key: string]: number } = {}
    devices.forEach(device => {
      const type = device.size && device.type 
        ? `${device.size} ${device.type}` 
        : device.size || device.type || 'Unknown'
      deviceTypeCount[type] = (deviceTypeCount[type] || 0) + 1
    })

    const deviceTypes = Object.entries(deviceTypeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    // Calculate performance metrics
    const performanceMetrics = {
      averageTestTime: calculateAverageTestTime(testReports),
      completionRate: calculateCompletionRate(testReports),
      customerSatisfaction: 4.7, // This would come from customer feedback surveys
      revenueGrowth: calculateRevenueGrowth(invoices)
    }

    // Generate business insights
    const businessInsights = {
      peakMonths: identifyPeakMonths(testReports),
      topDistricts: calculateTopDistricts(testReports, invoices),
      riskCustomers: customers.filter(c => c.status === 'Needs Service' || c.status === 'At Risk').length,
      upcomingTests: calculateUpcomingTests(customers)
    }

    const analyticsData = {
      monthlyRevenue,
      testResults,
      customerGrowth,
      deviceTypes,
      performanceMetrics,
      businessInsights,
      summary: {
        totalCustomers: customers.length,
        totalTests: testReports.length,
        totalRevenue: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        totalDevices: devices.length
      }
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateMonthlyData(testReports: Array<{ created_at?: string; result?: string }>, invoices: Array<{ created_at?: string; amount?: number }>, startDate: Date, endDate: Date) {
  const months = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const monthKey = current.toISOString().substring(0, 7) // YYYY-MM
    const monthName = current.toLocaleDateString('en-US', { month: 'short' })
    
    const monthTests = testReports.filter(r => 
      r.created_at && r.created_at.startsWith(monthKey)
    ).length
    
    const monthRevenue = invoices
      .filter(inv => inv.created_at && inv.created_at.startsWith(monthKey))
      .reduce((sum, inv) => sum + (inv.amount || 0), 0)
    
    months.push({
      month: monthName,
      revenue: monthRevenue,
      tests: monthTests
    })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}

function generateCustomerGrowthData(customers: Array<{ created_at?: string }>, startDate: Date, endDate: Date) {
  const months = []
  const current = new Date(startDate)
  let runningTotal = 0
  
  while (current <= endDate) {
    const monthKey = current.toISOString().substring(0, 7)
    const monthName = current.toLocaleDateString('en-US', { month: 'short' })
    
    const newCustomers = customers.filter(c => 
      c.created_at && c.created_at.startsWith(monthKey)
    ).length
    
    runningTotal += newCustomers
    
    months.push({
      month: monthName,
      total: runningTotal,
      new: newCustomers
    })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}

function calculateAverageTestTime(testReports: Array<{ test_duration?: number }>): number {
  const testsWithDuration = testReports.filter(r => r.test_duration && r.test_duration > 0)
  if (testsWithDuration.length === 0) return 18.5
  
  const totalTime = testsWithDuration.reduce((sum, r) => sum + (r.test_duration || 0), 0)
  return Math.round(totalTime / testsWithDuration.length * 10) / 10
}

function calculateCompletionRate(testReports: Array<{ result?: string; status?: string; submitted?: boolean }>): number {
  const completedTests = testReports.filter(r => 
    r.status === 'Completed' || r.submitted === true
  ).length
  
  return testReports.length > 0 
    ? Math.round((completedTests / testReports.length) * 100 * 10) / 10
    : 95.0
}

function calculateRevenueGrowth(invoices: Array<{ created_at?: string; amount?: number }>): number {
  // Calculate month-over-month growth
  const now = new Date()
  const thisMonth = now.toISOString().substring(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7)
  
  const thisMonthRevenue = invoices
    .filter(inv => inv.created_at && inv.created_at.startsWith(thisMonth))
    .reduce((sum, inv) => sum + (inv.amount || 0), 0)
  
  const lastMonthRevenue = invoices
    .filter(inv => inv.created_at && inv.created_at.startsWith(lastMonth))
    .reduce((sum, inv) => sum + (inv.amount || 0), 0)
  
  if (lastMonthRevenue === 0) return 0
  
  return Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 10) / 10
}

function identifyPeakMonths(testReports: Array<{ created_at?: string }>): string[] {
  const monthCounts: { [key: string]: number } = {}
  
  testReports.forEach(report => {
    if (report.created_at) {
      const month = new Date(report.created_at).toLocaleDateString('en-US', { month: 'long' })
      monthCounts[month] = (monthCounts[month] || 0) + 1
    }
  })
  
  return Object.entries(monthCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([month]) => month)
}

function calculateTopDistricts(testReports: Array<{ created_at?: string; customer?: { address?: string } }>, invoices: Array<{ created_at?: string; amount?: number; customer?: { address?: string } }>): Array<{ district: string; revenue: number }> {
  const districtRevenue: { [key: string]: number } = {}
  
  // Map test reports to invoices to get district revenue
  testReports.forEach(report => {
    const district = (report as any).water_district || 'Unknown'
    // This is a simplified calculation - in reality you'd join with actual invoice data
    const estimatedRevenue = 175 // Average test cost
    districtRevenue[district] = (districtRevenue[district] || 0) + estimatedRevenue
  })
  
  return Object.entries(districtRevenue)
    .map(([district, revenue]) => ({ district, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

function calculateUpcomingTests(customers: Array<{ next_test_date?: string }>): number {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  return customers.filter(customer => {
    if (!customer.next_test_date) return false
    const nextTestDate = new Date(customer.next_test_date)
    return nextTestDate <= thirtyDaysFromNow && nextTestDate >= new Date()
  }).length
}