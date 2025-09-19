// Analytics metrics calculation engine for Fisher Backflows

import { createRouteHandlerClient } from '@/lib/supabase'

export interface BusinessMetrics {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
    trend: 'up' | 'down' | 'stable'
  }
  customers: {
    total: number
    active: number
    new: number
    retention: number
    churn: number
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    scheduled: number
    completionRate: number
  }
  tests: {
    total: number
    passed: number
    failed: number
    passRate: number
    averagePressureDrop: number
  }
  performance: {
    averageResponseTime: number
    appointmentUtilization: number
    customerSatisfaction: number
    revenuePerCustomer: number
  }
}

export interface TimeSeriesData {
  date: string
  revenue: number
  appointments: number
  newCustomers: number
  testsCompleted: number
}

export interface CustomerAnalytics {
  id: string
  name: string
  email: string
  totalSpent: number
  appointmentCount: number
  lastAppointment: string
  averagePaymentTime: number
  riskScore: number
}

export class AnalyticsEngine {
  private supabase: any

  constructor(request: Request) {
    this.supabase = createRouteHandlerClient(request)
  }

  async calculateBusinessMetrics(startDate?: string, endDate?: string): Promise<BusinessMetrics> {
    const end = endDate || new Date().toISOString()
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Get current month and last month dates
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    try {
      // Revenue metrics
      const [revenueQuery, customersQuery, appointmentsQuery, testsQuery] = await Promise.all([
        this.calculateRevenueMetrics(currentMonthStart, lastMonthStart, lastMonthEnd),
        this.calculateCustomerMetrics(),
        this.calculateAppointmentMetrics(),
        this.calculateTestMetrics()
      ])

      return {
        revenue: revenueQuery,
        customers: customersQuery,
        appointments: appointmentsQuery,
        tests: testsQuery,
        performance: await this.calculatePerformanceMetrics()
      }
    } catch (error) {
      console.error('Error calculating business metrics:', error)
      throw error
    }
  }

  private async calculateRevenueMetrics(currentMonthStart: string, lastMonthStart: string, lastMonthEnd: string) {
    // Total revenue
    const { data: totalRevenue } = await this.supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')

    // Current month revenue
    const { data: currentMonthRevenue } = await this.supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('payment_date', currentMonthStart)

    // Last month revenue
    const { data: lastMonthRevenue } = await this.supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('payment_date', lastMonthStart)
      .lte('payment_date', lastMonthEnd)

    const total = totalRevenue?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const thisMonth = currentMonthRevenue?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const lastMonth = lastMonthRevenue?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    
    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (growth > 5) trend = 'up'
    if (growth < -5) trend = 'down'

    return { total, thisMonth, lastMonth, growth, trend }
  }

  private async calculateCustomerMetrics() {
    // Total customers
    const { data: allCustomers, count: totalCount } = await this.supabase
      .from('customers')
      .select('id, account_status, created_at', { count: 'exact' })

    // Active customers (with recent appointments)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: activeCount } = await this.supabase
      .from('appointments')
      .select('customer_id', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo)

    // New customers this month
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { count: newCount } = await this.supabase
      .from('customers')
      .select('id', { count: 'exact' })
      .gte('created_at', currentMonthStart)

    // Calculate retention and churn (simplified)
    const retention = totalCount ? Math.round((activeCount || 0) / totalCount * 100) : 0
    const churn = 100 - retention

    return {
      total: totalCount || 0,
      active: activeCount || 0,
      new: newCount || 0,
      retention,
      churn
    }
  }

  private async calculateAppointmentMetrics() {
    // All appointments
    const { data: appointments, count: totalCount } = await this.supabase
      .from('appointments')
      .select('status', { count: 'exact' })

    const completed = appointments?.filter(a => a.status === 'completed').length || 0
    const cancelled = appointments?.filter(a => a.status === 'cancelled').length || 0
    const scheduled = appointments?.filter(a => a.status === 'scheduled').length || 0
    
    const completionRate = totalCount ? Math.round((completed / totalCount) * 100) : 0

    return {
      total: totalCount || 0,
      completed,
      cancelled,
      scheduled,
      completionRate
    }
  }

  private async calculateTestMetrics() {
    // Test reports
    const { data: tests, count: totalCount } = await this.supabase
      .from('test_reports')
      .select('test_passed, pressure_drop', { count: 'exact' })

    const passed = tests?.filter(t => t.test_passed === true).length || 0
    const failed = tests?.filter(t => t.test_passed === false).length || 0
    const passRate = totalCount ? Math.round((passed / totalCount) * 100) : 0
    
    const pressureDrops = tests?.map(t => Number(t.pressure_drop)).filter(p => !isNaN(p)) || []
    const averagePressureDrop = pressureDrops.length > 0 
      ? pressureDrops.reduce((sum, p) => sum + p, 0) / pressureDrops.length 
      : 0

    return {
      total: totalCount || 0,
      passed,
      failed,
      passRate,
      averagePressureDrop: Math.round(averagePressureDrop * 100) / 100
    }
  }

  private async calculatePerformanceMetrics() {
    // Average response time (appointment booking to completion)
    const { data: responseData } = await this.supabase
      .from('appointments')
      .select('created_at, actual_end_time')
      .not('actual_end_time', 'is', null)

    const responseTimes = responseData?.map(a => {
      const created = new Date(a.created_at).getTime()
      const completed = new Date(a.actual_end_time).getTime()
      return (completed - created) / (1000 * 60 * 60 * 24) // Days
    }) || []

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    // Appointment utilization (scheduled vs available slots)
    const { count: scheduledCount } = await this.supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .gte('scheduled_date', new Date().toISOString().split('T')[0])

    // Estimate utilization (simplified - assumes 8 appointments per day capacity)
    const appointmentUtilization = Math.min((scheduledCount || 0) / 8 * 100, 100)

    // Revenue per customer
    const { data: revenuePerCustomer } = await this.supabase
      .from('payments')
      .select('customer_id, amount')
      .eq('status', 'completed')

    const customerRevenues = new Map<string, number>()
    revenuePerCustomer?.forEach(p => {
      const current = customerRevenues.get(p.customer_id) || 0
      customerRevenues.set(p.customer_id, current + Number(p.amount))
    })

    const revenues = Array.from(customerRevenues.values())
    const revenuePerCustomerAvg = revenues.length > 0
      ? revenues.reduce((sum, r) => sum + r, 0) / revenues.length
      : 0

    return {
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      appointmentUtilization: Math.round(appointmentUtilization),
      customerSatisfaction: 92, // Placeholder - implement with feedback system
      revenuePerCustomer: Math.round(revenuePerCustomerAvg)
    }
  }

  async getTimeSeriesData(days: number = 30): Promise<TimeSeriesData[]> {
    const endDate = new Date()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const timeSeriesData: TimeSeriesData[] = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const nextDateStr = new Date(d.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get data for this day
      const [revenue, appointments, customers, tests] = await Promise.all([
        this.getDailyRevenue(dateStr, nextDateStr),
        this.getDailyAppointments(dateStr, nextDateStr),
        this.getDailyNewCustomers(dateStr, nextDateStr),
        this.getDailyTests(dateStr, nextDateStr)
      ])

      timeSeriesData.push({
        date: dateStr,
        revenue,
        appointments,
        newCustomers: customers,
        testsCompleted: tests
      })
    }

    return timeSeriesData
  }

  private async getDailyRevenue(dateStr: string, nextDateStr: string): Promise<number> {
    const { data } = await this.supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('payment_date', dateStr)
      .lt('payment_date', nextDateStr)

    return data?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
  }

  private async getDailyAppointments(dateStr: string, nextDateStr: string): Promise<number> {
    const { count } = await this.supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .gte('scheduled_date', dateStr)
      .lt('scheduled_date', nextDateStr)

    return count || 0
  }

  private async getDailyNewCustomers(dateStr: string, nextDateStr: string): Promise<number> {
    const { count } = await this.supabase
      .from('customers')
      .select('id', { count: 'exact' })
      .gte('created_at', dateStr)
      .lt('created_at', nextDateStr)

    return count || 0
  }

  private async getDailyTests(dateStr: string, nextDateStr: string): Promise<number> {
    const { count } = await this.supabase
      .from('test_reports')
      .select('id', { count: 'exact' })
      .gte('test_date', dateStr)
      .lt('test_date', nextDateStr)

    return count || 0
  }

  async getTopCustomers(limit: number = 10): Promise<CustomerAnalytics[]> {
    // Get customer revenue data
    const { data: customerData } = await this.supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        email,
        created_at,
        payments(amount, payment_date),
        appointments(created_at, actual_end_time)
      `)

    const analytics: CustomerAnalytics[] = customerData?.map((customer: any) => {
      const totalSpent = customer.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
      const appointmentCount = customer.appointments?.length || 0
      
      const lastAppointment = customer.appointments?.length > 0
        ? customer.appointments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : customer.created_at

      // Calculate average payment time (simplified)
      const averagePaymentTime = 15 // Placeholder

      // Risk score (0-100, higher = more risk)
      let riskScore = 0
      if (totalSpent === 0) riskScore += 30
      if (appointmentCount === 0) riskScore += 25
      if (new Date(lastAppointment) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) riskScore += 45

      return {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        totalSpent,
        appointmentCount,
        lastAppointment,
        averagePaymentTime,
        riskScore: Math.min(riskScore, 100)
      }
    }).sort((a: any, b: any) => b.totalSpent - a.totalSpent).slice(0, limit) || []

    return analytics
  }

  async getRevenueForecast(months: number = 6): Promise<{ month: string; projected: number; confidence: number }[]> {
    // Get historical revenue data
    const { data: historicalData } = await this.supabase
      .from('payments')
      .select('payment_date, amount')
      .eq('status', 'completed')
      .gte('payment_date', new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString())

    // Simple linear trend calculation
    const monthlyRevenue = new Map<string, number>()
    
    historicalData?.forEach((payment: any) => {
      const monthKey = payment.payment_date.substring(0, 7) // YYYY-MM
      const current = monthlyRevenue.get(monthKey) || 0
      monthlyRevenue.set(monthKey, current + Number(payment.amount))
    })

    const revenues = Array.from(monthlyRevenue.values())
    const avgGrowth = revenues.length > 1 
      ? (revenues[revenues.length - 1] - revenues[0]) / revenues.length 
      : 0
    
    const lastRevenue = revenues[revenues.length - 1] || 0

    // Generate forecast
    const forecast = []
    for (let i = 1; i <= months; i++) {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + i)
      const monthKey = futureDate.toISOString().substring(0, 7)
      
      const projected = lastRevenue + (avgGrowth * i)
      const confidence = Math.max(95 - (i * 10), 50) // Decrease confidence over time

      forecast.push({
        month: monthKey,
        projected: Math.max(projected, 0),
        confidence
      })
    }

    return forecast
  }

  async getOperationalInsights(): Promise<{
    bottlenecks: string[]
    opportunities: string[]
    alerts: string[]
    recommendations: string[]
  }> {
    const metrics = await this.calculateBusinessMetrics()

    const insights = {
      bottlenecks: [] as string[],
      opportunities: [] as string[],
      alerts: [] as string[],
      recommendations: [] as string[]
    }

    // Analyze bottlenecks
    if (metrics.appointments.completionRate < 80) {
      insights.bottlenecks.push('Low appointment completion rate')
    }
    if (metrics.performance.appointmentUtilization > 90) {
      insights.bottlenecks.push('Schedule at capacity - consider adding technicians')
    }

    // Identify opportunities
    if (metrics.customers.churn < 10) {
      insights.opportunities.push('High customer retention - opportunity for upselling')
    }
    if (metrics.tests.passRate > 95) {
      insights.opportunities.push('Excellent test pass rate - marketing opportunity')
    }

    // Generate alerts
    if (metrics.revenue.growth < -10) {
      insights.alerts.push('Revenue declining - immediate attention needed')
    }
    if (metrics.customers.new < 5) {
      insights.alerts.push('Low new customer acquisition this month')
    }

    // Provide recommendations
    if (metrics.performance.revenuePerCustomer < 500) {
      insights.recommendations.push('Consider service package upselling')
    }
    if (metrics.appointments.scheduled > 20) {
      insights.recommendations.push('High demand - consider premium pricing')
    }

    return insights
  }
}