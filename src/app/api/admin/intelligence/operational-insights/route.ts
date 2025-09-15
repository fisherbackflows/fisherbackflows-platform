import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictiveAnalyticsEngine } from '@/lib/ai/predictive-engine';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '30d';
    const includeRecommendations = url.searchParams.get('recommendations') === 'true';

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

    const engine = new PredictiveAnalyticsEngine();
    const insights = await engine.generateOperationalInsights();

    // Calculate additional real-time metrics
    const now = new Date();
    const timeframeDays = parseInt(timeframe.replace('d', '')) || 30;
    const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

    // Get performance metrics for the timeframe
    const [appointmentData, revenueData, customerData] = await Promise.all([
      // Appointment completion rates
      supabase
        .from('appointments')
        .select('status, scheduled_date, actual_start_time, actual_end_time')
        .gte('scheduled_date', startDate.toISOString())
        .lte('scheduled_date', now.toISOString()),
      
      // Revenue metrics
      supabase
        .from('invoices')
        .select('total_amount, created_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString()),
      
      // Customer acquisition
      supabase
        .from('customers')
        .select('id, created_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
    ]);

    // Enhanced insights with real data
    const enhancedInsights = {
      ...insights,
      timeframe,
      realTimeMetrics: {
        appointments: {
          total: appointmentData.data?.length || 0,
          completed: appointmentData.data?.filter((apt: any) => apt.status === 'completed').length || 0,
          avgDuration: calculateAverageAppointmentDuration(appointmentData.data || []),
          onTimeRate: calculateOnTimeRate(appointmentData.data || [])
        },
        revenue: {
          total: revenueData.data?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || '0'), 0) || 0,
          invoiceCount: revenueData.data?.length || 0,
          paidInvoices: revenueData.data?.filter((inv: any) => inv.status === 'paid').length || 0,
          averageInvoiceValue: revenueData.data?.length
            ? (revenueData.data.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || '0'), 0) / revenueData.data.length)
            : 0
        },
        customers: {
          newCustomers: customerData.data?.length || 0,
          activeCustomers: customerData.data?.filter((cust: any) => cust.status === 'active').length || 0,
          acquisitionRate: calculateCustomerAcquisitionRate(customerData.data || [], timeframeDays)
        }
      }
    };

    if (includeRecommendations) {
      enhancedInsights.actionableRecommendations = generateOperationalRecommendations(enhancedInsights);
    }

    return NextResponse.json(enhancedInsights);
  } catch (error) {
    console.error('Operational insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for metrics calculations
function calculateAverageAppointmentDuration(appointments: any[]): number {
  const completedAppointments = appointments.filter(apt => 
    apt.actual_start_time && apt.actual_end_time
  );
  
  if (completedAppointments.length === 0) return 0;
  
  const totalDuration = completedAppointments.reduce((sum, apt) => {
    const start = new Date(apt.actual_start_time).getTime();
    const end = new Date(apt.actual_end_time).getTime();
    return sum + (end - start);
  }, 0);
  
  return Math.round(totalDuration / completedAppointments.length / (1000 * 60)); // Minutes
}

function calculateOnTimeRate(appointments: any[]): number {
  const scheduledAppointments = appointments.filter(apt => 
    apt.scheduled_date && apt.actual_start_time
  );
  
  if (scheduledAppointments.length === 0) return 100;
  
  const onTimeAppointments = scheduledAppointments.filter(apt => {
    const scheduled = new Date(apt.scheduled_date).getTime();
    const actual = new Date(apt.actual_start_time).getTime();
    const diffMinutes = Math.abs(actual - scheduled) / (1000 * 60);
    return diffMinutes <= 15; // Within 15 minutes is considered on-time
  });
  
  return Math.round((onTimeAppointments.length / scheduledAppointments.length) * 100);
}

function calculateCustomerAcquisitionRate(customers: any[], days: number): number {
  if (customers.length === 0) return 0;
  return Math.round((customers.length / days) * 100) / 100; // Customers per day
}

function generateOperationalRecommendations(insights: any): Array<{
  category: string;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
}> {
  const recommendations = [];
  const metrics = insights.realTimeMetrics;
  
  // Appointment efficiency recommendations
  if (metrics.appointments.onTimeRate < 80) {
    recommendations.push({
      category: 'scheduling',
      priority: 'high' as const,
      recommendation: 'Implement route optimization and buffer time between appointments to improve on-time performance',
      expectedImpact: 'Increase customer satisfaction by 15-20% and reduce technician stress',
      implementationEffort: 'medium' as const
    });
  }
  
  // Revenue optimization recommendations
  if (metrics.revenue.paidInvoices / metrics.revenue.invoiceCount < 0.9) {
    recommendations.push({
      category: 'finance',
      priority: 'high' as const,
      recommendation: 'Implement automated payment reminders and streamlined payment processing',
      expectedImpact: 'Reduce accounts receivable by 25% and improve cash flow',
      implementationEffort: 'low' as const
    });
  }
  
  // Customer acquisition recommendations
  if (metrics.customers.acquisitionRate < 1) {
    recommendations.push({
      category: 'marketing',
      priority: 'medium' as const,
      recommendation: 'Develop referral program and targeted local marketing campaigns',
      expectedImpact: 'Increase customer acquisition by 30-40%',
      implementationEffort: 'medium' as const
    });
  }
  
  // Operational efficiency recommendations
  if (metrics.appointments.avgDuration > 90) {
    recommendations.push({
      category: 'operations',
      priority: 'medium' as const,
      recommendation: 'Provide additional technician training and optimize equipment preparation',
      expectedImpact: 'Reduce service time by 15-20 minutes per appointment',
      implementationEffort: 'high' as const
    });
  }
  
  return recommendations;
}