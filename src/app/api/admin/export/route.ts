import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { dataExportService, type ExportFormat } from '@/lib/data-export';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { type, format, options } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    let data: any[] = [];
    let recordCount = 0;

    // Fetch data based on type
    switch (type) {
      case 'customers':
        const { data: customers } = await supabase
          .from('customers')
          .select(`
            *,
            devices (
              device_id,
              device_type,
              location,
              installation_date
            ),
            test_reports (
              test_id,
              test_date,
              status,
              compliance_status
            )
          `)
          .order('created_at', { ascending: false });
        
        data = customers || [];
        recordCount = data.length;
        break;

      case 'test_reports':
        const { data: reports } = await supabase
          .from('test_reports')
          .select(`
            *,
            customers (
              name,
              account_number
            ),
            devices (
              device_type,
              location
            )
          `)
          .order('test_date', { ascending: false });
        
        data = reports || [];
        recordCount = data.length;
        break;

      case 'invoices':
        const { data: invoices } = await supabase
          .from('invoices')
          .select(`
            *,
            customers (
              name,
              account_number
            ),
            payments (
              payment_id,
              amount,
              payment_date,
              method
            )
          `)
          .order('created_at', { ascending: false });
        
        data = invoices || [];
        recordCount = data.length;
        break;

      case 'appointments':
        const { data: appointments } = await supabase
          .from('appointments')
          .select(`
            *,
            customers (
              name,
              account_number
            ),
            team_members (
              name
            )
          `)
          .order('scheduled_date', { ascending: false });
        
        data = appointments || [];
        recordCount = data.length;
        break;

      case 'analytics':
        // Generate analytics data
        const analyticsData = await generateAnalyticsData(supabase);
        data = analyticsData;
        recordCount = data.length;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }

    // Generate export based on format
    let exportData: string | Blob;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format as ExportFormat) {
      case 'csv':
        exportData = await dataExportService.exportCustomers(data, { format: 'csv' }) as string;
        contentType = 'text/csv';
        filename = `${type}_export_${timestamp}.csv`;
        break;

      case 'json':
        exportData = await dataExportService.exportCustomers(data, { format: 'json' }) as string;
        contentType = 'application/json';
        filename = `${type}_export_${timestamp}.json`;
        break;

      case 'pdf':
        exportData = await dataExportService.exportCustomers(data, { format: 'pdf' }) as Blob;
        contentType = 'application/pdf';
        filename = `${type}_export_${timestamp}.pdf`;
        break;

      case 'excel':
        exportData = await dataExportService.exportCustomers(data, { format: 'excel' }) as Blob;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${type}_export_${timestamp}.xlsx`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }

    // Return appropriate response based on format
    if (format === 'csv' || format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
        recordCount,
        filename
      });
    } else {
      // For binary formats (PDF, Excel)
      return new NextResponse(exportData as Blob, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateAnalyticsData(supabase: any) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get various analytics metrics
  const [
    customersCount,
    testsCount,
    appointmentsCount,
    revenueData,
    complianceStats
  ] = await Promise.all([
    // Customer analytics
    supabase
      .from('customers')
      .select('created_at')
      .gte('created_at', lastMonth.toISOString()),

    // Test analytics
    supabase
      .from('test_reports')
      .select('test_date, status, compliance_status')
      .gte('test_date', lastMonth.toISOString()),

    // Appointment analytics
    supabase
      .from('appointments')
      .select('scheduled_date, status')
      .gte('scheduled_date', lastMonth.toISOString()),

    // Revenue analytics
    supabase
      .from('payments')
      .select('amount, payment_date')
      .gte('payment_date', lastMonth.toISOString()),

    // Compliance analytics
    supabase
      .from('test_reports')
      .select('compliance_status')
      .not('compliance_status', 'is', null)
  ]);

  // Process and structure the analytics data
  const analytics = [
    {
      metric: 'New Customers',
      period: 'Last 30 Days',
      value: customersCount.data?.length || 0,
      category: 'Growth'
    },
    {
      metric: 'Tests Completed',
      period: 'Last 30 Days',
      value: testsCount.data?.length || 0,
      category: 'Operations'
    },
    {
      metric: 'Appointments Scheduled',
      period: 'Last 30 Days',
      value: appointmentsCount.data?.length || 0,
      category: 'Operations'
    },
    {
      metric: 'Total Revenue',
      period: 'Last 30 Days',
      value: revenueData.data?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0,
      category: 'Financial'
    },
    {
      metric: 'Compliance Rate',
      period: 'All Time',
      value: complianceStats.data ?
        Math.round((complianceStats.data.filter((r: any) => r.compliance_status === 'compliant').length / complianceStats.data.length) * 100) : 0,
      category: 'Compliance'
    }
  ];

  return analytics;
}