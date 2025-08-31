import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, format, dateRange, filters = {} } = body;

    if (!reportType || !format) {
      return NextResponse.json(
        { success: false, error: 'Report type and format are required' },
        { status: 400 }
      );
    }

    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

    let data = [];
    let filename = '';
    let headers: string[] = [];

    switch (reportType) {
      case 'customers':
        const { data: customers } = await supabase
          .from('customers')
          .select(`
            id,
            name,
            email,
            phone,
            address,
            city,
            state,
            zip_code,
            status,
            created_at,
            updated_at
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        data = customers || [];
        filename = `customers-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
        headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Status', 'Created', 'Updated'];
        break;

      case 'appointments':
        const { data: appointments } = await supabase
          .from('appointments')
          .select(`
            id,
            customer_id,
            technician_id,
            service_type,
            scheduled_date,
            status,
            total_amount,
            notes,
            created_at
          `)
          .gte('scheduled_date', startDate.toISOString())
          .lte('scheduled_date', endDate.toISOString());

        data = appointments || [];
        filename = `appointments-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
        headers = ['ID', 'Customer ID', 'Technician ID', 'Service Type', 'Scheduled Date', 'Status', 'Amount', 'Notes', 'Created'];
        break;

      case 'financials':
        const { data: invoices } = await supabase
          .from('invoices')
          .select(`
            id,
            customer_id,
            appointment_id,
            amount,
            status,
            due_date,
            paid_date,
            created_at
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        data = invoices || [];
        filename = `financials-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
        headers = ['ID', 'Customer ID', 'Appointment ID', 'Amount', 'Status', 'Due Date', 'Paid Date', 'Created'];
        break;

      case 'audit':
        const { data: auditLogs } = await supabase
          .from('audit_logs')
          .select(`
            id,
            event_type,
            user_id,
            entity_type,
            entity_id,
            severity,
            success,
            timestamp,
            ip_address,
            user_agent
          `)
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order('timestamp', { ascending: false });

        data = auditLogs || [];
        filename = `audit-logs-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
        headers = ['ID', 'Event Type', 'User ID', 'Entity Type', 'Entity ID', 'Severity', 'Success', 'Timestamp', 'IP Address', 'User Agent'];
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Apply additional filters
    if (filters.status) {
      data = data.filter((item: any) => item.status === filters.status);
    }
    
    if (filters.customerId) {
      data = data.filter((item: any) => item.customer_id === filters.customerId);
    }

    // Format data based on requested format
    let content = '';
    let contentType = '';

    switch (format.toLowerCase()) {
      case 'csv':
        content = formatAsCSV(data, headers);
        contentType = 'text/csv';
        filename += '.csv';
        break;

      case 'json':
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        filename += '.json';
        break;

      case 'excel':
        // For Excel, we'll return CSV format that can be opened in Excel
        content = formatAsCSV(data, headers);
        contentType = 'application/vnd.ms-excel';
        filename += '.csv';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported export format' },
          { status: 400 }
        );
    }

    // Return the file content
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

function formatAsCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvHeaders = headers.join(',');
  const csvRows = data.map(item => {
    return Object.values(item).map(value => {
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      const stringValue = String(value || '');
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}