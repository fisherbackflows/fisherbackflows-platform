import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function checkPermissions(request: NextRequest) {
  const cookies = request.cookies;
  const teamSession = cookies.get('team_session')?.value;
  
  if (!teamSession) {
    return { hasAccess: false, isOwner: false, user: null };
  }
  
  try {
    const { data: session } = await supabaseAdmin
      .from('team_sessions')
      .select(`
        team_user_id,
        expires_at,
        team_users (
          id, email, role, is_active
        )
      `)
      .eq('session_token', teamSession)
      .gt('expires_at', new Date().toISOString())
      .single();
      
    if (!session?.team_users) {
      return { hasAccess: false, isOwner: false, user: null };
    }
    
    const user = session.team_users as any;
    const isOwner = user.email === 'blake@fisherbackflows.com' || user.role === 'admin';
    
    return { hasAccess: true, isOwner, user };
  } catch (error) {
    return { hasAccess: false, isOwner: false, user: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires analytics subscription' 
      }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));
    
    // Get business metrics
    const [
      appointmentsResult,
      invoicesResult,
      reportsResult,
      customersResult
    ] = await Promise.all([
      // Appointments analytics
      supabaseAdmin
        .from('appointments')
        .select('id, status, scheduled_date, estimated_cost')
        .gte('scheduled_date', startDate.toISOString()),
        
      // Invoice analytics
      supabaseAdmin
        .from('invoices')
        .select('id, status, amount, issued_date, payment_date')
        .gte('issued_date', startDate.toISOString()),
        
      // Test reports analytics
      supabaseAdmin
        .from('test_reports')
        .select('id, status, compliance_status, test_date')
        .gte('test_date', startDate.toISOString()),
        
      // Customer growth analytics
      supabaseAdmin
        .from('customers')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
    ]);

    const appointments = appointmentsResult.data || [];
    const invoices = invoicesResult.data || [];
    const reports = reportsResult.data || [];
    const customers = customersResult.data || [];

    // Calculate metrics
    const analytics = {
      overview: {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        totalRevenue: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
        totalCustomers: customers.length,
        complianceReports: reports.filter(r => r.compliance_status === 'compliant').length
      },
      appointmentTrends: generateDailyTrends(appointments, 'scheduled_date'),
      revenueTrends: generateRevenueTrends(invoices),
      complianceTrends: generateDailyTrends(reports, 'test_date'),
      customerGrowth: generateDailyTrends(customers, 'created_at'),
      statusBreakdowns: {
        appointments: getStatusBreakdown(appointments),
        invoices: getStatusBreakdown(invoices),
        reports: getComplianceBreakdown(reports)
      }
    };
    
    return NextResponse.json({
      success: true,
      analytics,
      timeframe: parseInt(timeframe)
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

function generateDailyTrends(data: any[], dateField: string) {
  const trends = {};
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    trends[date] = (trends[date] || 0) + 1;
  });
  return Object.entries(trends).map(([date, count]) => ({ date, count }));
}

function generateRevenueTrends(invoices: any[]) {
  const trends = {};
  invoices.forEach(invoice => {
    if (invoice.status === 'paid' && invoice.payment_date) {
      const date = new Date(invoice.payment_date).toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + (invoice.amount || 0);
    }
  });
  return Object.entries(trends).map(([date, amount]) => ({ date, amount }));
}

function getStatusBreakdown(data: any[]) {
  const breakdown = {};
  data.forEach(item => {
    const status = item.status || 'unknown';
    breakdown[status] = (breakdown[status] || 0) + 1;
  });
  return breakdown;
}

function getComplianceBreakdown(reports: any[]) {
  const breakdown = {};
  reports.forEach(report => {
    const status = report.compliance_status || 'unknown';
    breakdown[status] = (breakdown[status] || 0) + 1;
  });
  return breakdown;
}

export async function POST(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires analytics subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { event_type, event_data } = body;
    
    // Log analytics event for custom tracking
    const { data: event, error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type,
        event_data: event_data || {},
        created_by: user?.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to log analytics event'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event,
      message: 'Analytics event logged successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
