import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictiveAnalyticsEngine } from '@/lib/ai/predictive-engine';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '7d'; // 7d, 30d, 90d, 1y
    const refreshRate = parseInt(url.searchParams.get('refreshRate') || '300000'); // 5 minutes default

    // Verify admin access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teamUser } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!teamUser || (teamUser as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    const timeframeDays = getTimeframeDays(timeframe);
    const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

    // Fetch real-time KPI data
    const [
      appointmentData,
      revenueData,
      customerData,
      deviceData,
      techniciansData
    ] = await Promise.all([
      // Appointment KPIs
      supabase
        .from('appointments')
        .select('status, scheduled_date, actual_start_time, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // Revenue KPIs
      supabase
        .from('invoices')
        .select('total_amount, status, created_at, due_date')
        .gte('created_at', startDate.toISOString()),
      
      // Customer KPIs
      supabase
        .from('customers')
        .select('id, status, created_at, last_service_date')
        .gte('created_at', startDate.toISOString()),
      
      // Device KPIs
      supabase
        .from('devices')
        .select('id, device_type, last_test_date, next_test_due, status')
        .gte('created_at', startDate.toISOString()),
      
      // Team performance
      supabase
        .from('team_users')
        .select('id, role, created_at')
    ]);

    // Calculate Core KPIs
    const kpis = {
      // Revenue KPIs
      revenue: {
        total: calculateTotalRevenue(revenueData.data || []),
        growth: calculateRevenueGrowth(revenueData.data || [], timeframeDays),
        outstanding: calculateOutstandingRevenue(revenueData.data || []),
        averageInvoice: calculateAverageInvoiceValue(revenueData.data || [])
      },
      
      // Appointment KPIs
      appointments: {
        total: appointmentData.data?.length || 0,
        completed: appointmentData.data?.filter((apt: any) => apt.status === 'completed').length || 0,
        scheduled: appointmentData.data?.filter((apt: any) => apt.status === 'scheduled').length || 0,
        cancelled: appointmentData.data?.filter((apt: any) => apt.status === 'cancelled').length || 0,
        completionRate: calculateCompletionRate(appointmentData.data || [])
      },

      // Customer KPIs
      customers: {
        total: customerData.data?.length || 0,
        active: customerData.data?.filter((cust: any) => cust.status === 'active').length || 0,
        newCustomers: customerData.data?.length || 0,
        retention: calculateCustomerRetention(customerData.data || []),
        averageLifetime: calculateCustomerLifetime(customerData.data || [])
      },
      
      // Device & Compliance KPIs
      devices: {
        total: deviceData.data?.length || 0,
        dueForTesting: calculateDevicesDue(deviceData.data || []),
        overdue: calculateDevicesOverdue(deviceData.data || []),
        complianceRate: calculateComplianceRate(deviceData.data || [])
      },
      
      // Operational KPIs
      operations: {
        techniciansActive: techniciansData.data?.filter((tech: any) => tech.role === 'tester').length || 0,
        utilization: 85, // Placeholder - would calculate from actual schedule data
        efficiency: 92,  // Placeholder - would calculate from appointment durations
        customerSatisfaction: 4.6 // Placeholder - would come from customer feedback
      }
    };

    // Calculate trend data for charts
    const trends = await calculateTrendData(supabase, timeframe, timeframeDays);

    // Use AI for insights
    const engine = new PredictiveAnalyticsEngine();
    const aiInsights = await engine.generateOperationalInsights();

    const dashboardData = {
      timestamp: now.toISOString(),
      timeframe,
      refreshRate,
      kpis,
      trends,
      aiInsights: {
        alerts: extractAlerts(kpis),
        opportunities: aiInsights.businessOpportunities?.slice(0, 3) || [],
        predictions: aiInsights.predictions || {}
      },
      performance: {
        score: calculateOverallPerformanceScore(kpis),
        breakdown: {
          revenue: calculateRevenueScore(kpis.revenue),
          operations: calculateOperationsScore(kpis.appointments, kpis.operations),
          customer: calculateCustomerScore(kpis.customers),
          compliance: calculateComplianceScore(kpis.devices)
        }
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('KPI Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for KPI calculations
function getTimeframeDays(timeframe: string): number {
  const map: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  return map[timeframe] || 7;
}

function calculateTotalRevenue(invoices: any[]): number {
  return invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);
}

function calculateRevenueGrowth(invoices: any[], days: number): number {
  const now = new Date();
  const midpoint = new Date(now.getTime() - (days * 12 * 60 * 60 * 1000)); // Half the period
  
  const recentRevenue = invoices
    .filter(inv => inv.status === 'paid' && new Date(inv.created_at) >= midpoint)
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);
    
  const earlierRevenue = invoices
    .filter(inv => inv.status === 'paid' && new Date(inv.created_at) < midpoint)
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);
  
  if (earlierRevenue === 0) return recentRevenue > 0 ? 100 : 0;
  return Math.round(((recentRevenue - earlierRevenue) / earlierRevenue) * 100);
}

function calculateOutstandingRevenue(invoices: any[]): number {
  return invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);
}

function calculateAverageInvoiceValue(invoices: any[]): number {
  if (invoices.length === 0) return 0;
  const total = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);
  return Math.round(total / invoices.length);
}

function calculateCompletionRate(appointments: any[]): number {
  if (appointments.length === 0) return 100;
  const completed = appointments.filter(apt => apt.status === 'completed').length;
  return Math.round((completed / appointments.length) * 100);
}

function calculateCustomerRetention(customers: any[]): number {
  // Placeholder calculation - would need historical data
  return 87; // 87% retention rate
}

function calculateCustomerLifetime(customers: any[]): number {
  // Placeholder calculation - would calculate from historical service data
  return 2.3; // 2.3 years average lifetime
}

function calculateDevicesDue(devices: any[]): number {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  return devices.filter(device => {
    if (!device.next_test_due) return false;
    const dueDate = new Date(device.next_test_due);
    return dueDate <= thirtyDaysFromNow;
  }).length;
}

function calculateDevicesOverdue(devices: any[]): number {
  const now = new Date();
  
  return devices.filter(device => {
    if (!device.next_test_due) return false;
    const dueDate = new Date(device.next_test_due);
    return dueDate < now;
  }).length;
}

function calculateComplianceRate(devices: any[]): number {
  if (devices.length === 0) return 100;
  const compliant = devices.filter(device => {
    if (!device.next_test_due) return true; // No due date means compliant
    return new Date(device.next_test_due) >= new Date();
  }).length;
  
  return Math.round((compliant / devices.length) * 100);
}

async function calculateTrendData(supabase: any, timeframe: string, days: number) {
  // Generate daily data points for trends
  const trends = {
    revenue: [],
    appointments: [],
    customers: []
  };
  
  // This would typically query for daily/weekly aggregated data
  // For now, returning sample trend data
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
    trends.revenue.push({
      date: date.toISOString().split('T')[0],
      value: Math.random() * 1000 + 500
    });
    trends.appointments.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 10 + 5)
    });
    trends.customers.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 3 + 1)
    });
  }
  
  return trends;
}

function extractAlerts(kpis: any): Array<{
  type: 'warning' | 'critical' | 'info';
  message: string;
  category: string;
}> {
  const alerts = [];
  
  if (kpis.devices.overdue > 0) {
    alerts.push({
      type: 'critical' as const,
      message: `${kpis.devices.overdue} devices are overdue for testing`,
      category: 'compliance'
    });
  }
  
  if (kpis.revenue.outstanding > 5000) {
    alerts.push({
      type: 'warning' as const,
      message: `$${kpis.revenue.outstanding.toLocaleString()} in outstanding invoices`,
      category: 'finance'
    });
  }
  
  if (kpis.appointments.completionRate < 80) {
    alerts.push({
      type: 'warning' as const,
      message: `Appointment completion rate is ${kpis.appointments.completionRate}%`,
      category: 'operations'
    });
  }
  
  return alerts;
}

function calculateOverallPerformanceScore(kpis: any): number {
  const revenueScore = calculateRevenueScore(kpis.revenue);
  const operationsScore = calculateOperationsScore(kpis.appointments, kpis.operations);
  const customerScore = calculateCustomerScore(kpis.customers);
  const complianceScore = calculateComplianceScore(kpis.devices);
  
  return Math.round((revenueScore + operationsScore + customerScore + complianceScore) / 4);
}

function calculateRevenueScore(revenue: any): number {
  let score = 70; // Base score
  if (revenue.growth > 10) score += 20;
  else if (revenue.growth > 0) score += 10;
  if (revenue.outstanding < 1000) score += 10;
  return Math.min(100, score);
}

function calculateOperationsScore(appointments: any, operations: any): number {
  let score = 70; // Base score
  if (appointments.completionRate > 90) score += 20;
  else if (appointments.completionRate > 80) score += 10;
  if (operations.efficiency > 90) score += 10;
  return Math.min(100, score);
}

function calculateCustomerScore(customers: any): number {
  let score = 70; // Base score
  if (customers.retention > 85) score += 20;
  else if (customers.retention > 75) score += 10;
  if (customers.newCustomers > 5) score += 10;
  return Math.min(100, score);
}

function calculateComplianceScore(devices: any): number {
  return devices.complianceRate; // Direct mapping
}