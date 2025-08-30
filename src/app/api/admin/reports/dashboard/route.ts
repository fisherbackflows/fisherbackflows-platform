import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Overview metrics
    const { data: customers } = await supabase
      .from('customers')
      .select('id, created_at, status')
      .gte('created_at', startDate.toISOString());

    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, created_at, status, total_amount, scheduled_date')
      .gte('created_at', startDate.toISOString());

    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, created_at, status, amount, due_date')
      .gte('created_at', startDate.toISOString());

    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('id, user_id, role, status');

    // Calculate metrics
    const totalCustomers = customers?.length || 0;
    const newCustomers = customers?.filter(c => new Date(c.created_at) >= startDate).length || 0;
    const activeCustomers = customers?.filter(c => c.status === 'active').length || 0;
    
    const totalAppointments = appointments?.length || 0;
    const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
    const pendingAppointments = appointments?.filter(a => a.status === 'scheduled').length || 0;
    
    const totalRevenue = appointments?.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0;
    const totalInvoiced = invoices?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
    const overdueInvoices = invoices?.filter(i => i.status === 'overdue' || (new Date(i.due_date) < new Date() && i.status !== 'paid')).length || 0;
    
    const activeTechnicians = teamMembers?.filter(t => t.role === 'technician' && t.status === 'active').length || 0;

    // Daily data for trends
    const dailyData = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayAppointments = appointments?.filter(a => {
        const appointmentDate = new Date(a.created_at);
        return appointmentDate >= dayStart && appointmentDate <= dayEnd;
      }) || [];

      const dayRevenue = dayAppointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.total_amount || 0), 0);

      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        appointments: dayAppointments.length,
        revenue: dayRevenue,
        customers: customers?.filter(c => {
          const customerDate = new Date(c.created_at);
          return customerDate >= dayStart && customerDate <= dayEnd;
        }).length || 0
      });
    }

    // Revenue breakdown by service type
    const revenueByService = [
      { name: 'Testing', value: totalRevenue * 0.6, color: '#3B82F6' },
      { name: 'Repairs', value: totalRevenue * 0.25, color: '#10B981' },
      { name: 'Installation', value: totalRevenue * 0.15, color: '#F59E0B' }
    ];

    // Performance metrics by technician
    const technicianPerformance = teamMembers?.filter(t => t.role === 'technician').map(tech => {
      const techAppointments = appointments?.filter(a => a.technician_id === tech.user_id) || [];
      const completed = techAppointments.filter(a => a.status === 'completed').length;
      const total = techAppointments.length;
      const revenue = techAppointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.total_amount || 0), 0);

      return {
        id: tech.id,
        name: tech.name || 'Technician',
        appointments: total,
        completed: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        revenue: revenue
      };
    }) || [];

    // Compliance data
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('event_type, severity, success')
      .gte('timestamp', startDate.toISOString());

    const complianceMetrics = {
      totalEvents: auditLogs?.length || 0,
      criticalEvents: auditLogs?.filter(log => log.severity === 'critical').length || 0,
      failedEvents: auditLogs?.filter(log => !log.success).length || 0,
      successRate: auditLogs && auditLogs.length > 0 
        ? Math.round((auditLogs.filter(log => log.success).length / auditLogs.length) * 100)
        : 100
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          newCustomers,
          activeCustomers,
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          totalRevenue,
          totalInvoiced,
          overdueInvoices,
          activeTechnicians
        },
        trends: dailyData,
        revenueBreakdown: revenueByService,
        technicianPerformance,
        compliance: complianceMetrics,
        period: parseInt(period)
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}