import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

// GET - Export data in various formats
export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type'); // customers, devices, appointments, test_reports, invoices
    const format = searchParams.get('format') || 'csv'; // csv, json, xlsx
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (!dataType) {
      return NextResponse.json(
        { error: 'Data type parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);
    let data: any[] = [];
    let filename = '';

    // Build date filter if provided
    const dateFilter = dateFrom && dateTo ? {
      gte: dateFrom,
      lte: dateTo
    } : null;

    switch (dataType) {
      case 'customers':
        const customerQuery = supabase
          .from('customers')
          .select('*');
        
        if (!includeArchived) {
          customerQuery.neq('account_status', 'archived');
        }
        
        if (dateFilter) {
          customerQuery.gte('created_at', dateFilter.gte).lte('created_at', dateFilter.lte);
        }

        const { data: customers, error: customerError } = await customerQuery.order('created_at', { ascending: false });

        if (customerError) {
          return NextResponse.json({ error: 'Failed to export customers: ' + customerError.message }, { status: 500 });
        }

        data = customers || [];
        filename = `customers_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'devices':
        const deviceQuery = supabase
          .from('devices')
          .select(`
            *,
            customer:customers(first_name, last_name, email, account_number)
          `);

        if (dateFilter) {
          deviceQuery.gte('created_at', dateFilter.gte).lte('created_at', dateFilter.lte);
        }

        const { data: devices, error: deviceError } = await deviceQuery.order('created_at', { ascending: false });

        if (deviceError) {
          return NextResponse.json({ error: 'Failed to export devices: ' + deviceError.message }, { status: 500 });
        }

        // Flatten customer data for CSV export
        data = (devices || []).map(device => ({
          ...device,
          customer_name: device.customer ? `${device.customer.first_name} ${device.customer.last_name}` : '',
          customer_email: device.customer?.email || '',
          customer_account: device.customer?.account_number || '',
          customer: undefined // Remove nested object for CSV
        }));
        filename = `devices_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'appointments':
        const appointmentQuery = supabase
          .from('appointments')
          .select(`
            *,
            customer:customers(first_name, last_name, email, phone),
            technician:team_users(first_name, last_name, email)
          `);

        if (dateFilter) {
          appointmentQuery.gte('scheduled_date', dateFilter.gte).lte('scheduled_date', dateFilter.lte);
        }

        const { data: appointments, error: appointmentError } = await appointmentQuery.order('scheduled_date', { ascending: false });

        if (appointmentError) {
          return NextResponse.json({ error: 'Failed to export appointments: ' + appointmentError.message }, { status: 500 });
        }

        // Flatten data
        data = (appointments || []).map(apt => ({
          ...apt,
          customer_name: apt.customer ? `${apt.customer.first_name} ${apt.customer.last_name}` : '',
          customer_email: apt.customer?.email || '',
          customer_phone: apt.customer?.phone || '',
          technician_name: apt.technician ? `${apt.technician.first_name} ${apt.technician.last_name}` : '',
          technician_email: apt.technician?.email || '',
          customer: undefined,
          technician: undefined
        }));
        filename = `appointments_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'test_reports':
        const reportQuery = supabase
          .from('test_reports')
          .select(`
            *,
            appointment:appointments(
              customer:customers(first_name, last_name, email),
              technician:team_users(first_name, last_name)
            ),
            device:devices(make, model, serial_number, location)
          `);

        if (dateFilter) {
          reportQuery.gte('test_date', dateFilter.gte).lte('test_date', dateFilter.lte);
        }

        const { data: reports, error: reportError } = await reportQuery.order('test_date', { ascending: false });

        if (reportError) {
          return NextResponse.json({ error: 'Failed to export test reports: ' + reportError.message }, { status: 500 });
        }

        // Flatten nested data
        data = (reports || []).map(report => ({
          ...report,
          customer_name: report.appointment?.customer ? `${report.appointment.customer.first_name} ${report.appointment.customer.last_name}` : '',
          customer_email: report.appointment?.customer?.email || '',
          technician_name: report.appointment?.technician ? `${report.appointment.technician.first_name} ${report.appointment.technician.last_name}` : '',
          device_make: report.device?.make || '',
          device_model: report.device?.model || '',
          device_serial: report.device?.serial_number || '',
          device_location: report.device?.location || '',
          appointment: undefined,
          device: undefined
        }));
        filename = `test_reports_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'invoices':
        const invoiceQuery = supabase
          .from('invoices')
          .select(`
            *,
            customer:customers(first_name, last_name, email, account_number)
          `);

        if (dateFilter) {
          invoiceQuery.gte('invoice_date', dateFilter.gte).lte('invoice_date', dateFilter.lte);
        }

        const { data: invoices, error: invoiceError } = await invoiceQuery.order('invoice_date', { ascending: false });

        if (invoiceError) {
          return NextResponse.json({ error: 'Failed to export invoices: ' + invoiceError.message }, { status: 500 });
        }

        data = (invoices || []).map(invoice => ({
          ...invoice,
          customer_name: invoice.customer ? `${invoice.customer.first_name} ${invoice.customer.last_name}` : '',
          customer_email: invoice.customer?.email || '',
          customer_account: invoice.customer?.account_number || '',
          customer: undefined
        }));
        filename = `invoices_export_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    // Generate export based on format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: data,
        count: data.length,
        exported_at: new Date().toISOString(),
        type: dataType
      });
    } 
    
    else if (format === 'csv') {
      if (data.length === 0) {
        return new NextResponse('No data to export', { 
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`
          }
        });
      }

      // Convert to CSV
      const headers = Object.keys(data[0]).filter(key => 
        !['id', 'created_at', 'updated_at'].includes(key) || key === 'id'
      );
      
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      );

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    }

    else {
      return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Server error during export' },
      { status: 500 }
    );
  }
}

// POST - Generate custom export with specific fields
export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      dataType,
      fields,
      filters,
      format = 'csv',
      orderBy,
      limit
    } = body;

    if (!dataType || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Data type and fields array are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);
    
    // Build dynamic query
    let query = supabase.from(dataType).select(fields.join(', '));

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(field, value);
        }
      });
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.field, { ascending: orderBy.ascending !== false });
    }

    // Apply limit
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to export data: ' + error.message },
        { status: 500 }
      );
    }

    const filename = `${dataType}_custom_export_${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: data || [],
        count: data?.length || 0,
        exported_at: new Date().toISOString(),
        type: dataType,
        fields: fields
      });
    } else {
      // CSV export
      if (!data || data.length === 0) {
        return new NextResponse('No data to export', { 
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`
          }
        });
      }

      const csvHeaders = fields.join(',');
      const csvRows = data.map(row => 
        fields.map(field => {
          const value = row[field];
          if (value === null || value === undefined) return '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      );

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    }

  } catch (error) {
    console.error('Custom export API error:', error);
    return NextResponse.json(
      { error: 'Server error during custom export' },
      { status: 500 }
    );
  }
}