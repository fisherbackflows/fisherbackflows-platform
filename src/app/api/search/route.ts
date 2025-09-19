import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // customers, appointments, invoices, all
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status')?.split(',') || [];
    const serviceType = searchParams.get('service_type')?.split(',') || [];
    const location = searchParams.get('location');
    const technician = searchParams.get('technician');
    const minAmount = parseFloat(searchParams.get('min_amount') || '0');
    const maxAmount = parseFloat(searchParams.get('max_amount') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = createRouteHandlerClient({ cookies });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const offset = (page - 1) * limit;
    const results = { customers: [], appointments: [], invoices: [], total: 0 };

    // Search customers
    if (type === 'all' || type === 'customers') {
      let customersQuery = supabase
        .from('customers')
        .select(`
          customer_id,
          name,
          email,
          phone,
          address,
          city,
          state,
          zip_code,
          account_number,
          status,
          created_at,
          devices (
            device_id,
            device_type,
            location
          ),
          test_reports (
            test_id,
            test_date,
            status
          )
        `);

      // Apply filters
      if (query) {
        customersQuery = customersQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,account_number.ilike.%${query}%`);
      }

      if (startDate) {
        customersQuery = customersQuery.gte('created_at', startDate);
      }

      if (endDate) {
        customersQuery = customersQuery.lte('created_at', endDate);
      }

      if (status.length > 0) {
        customersQuery = customersQuery.in('status', status);
      }

      if (location) {
        customersQuery = customersQuery.or(`city.ilike.%${location}%,state.ilike.%${location}%,zip_code.ilike.%${location}%,address.ilike.%${location}%`);
      }

      // Add pagination for specific customer search
      if (type === 'customers') {
        customersQuery = customersQuery.range(offset, offset + limit - 1);
      }

      const { data: customers } = await customersQuery.order('created_at', { ascending: false });
      results.customers = customers || [];
    }

    // Search appointments
    if (type === 'all' || type === 'appointments') {
      let appointmentsQuery = supabase
        .from('appointments')
        .select(`
          appointment_id,
          customer_id,
          technician_id,
          scheduled_date,
          estimated_duration,
          service_type,
          status,
          notes,
          created_at,
          customers (
            name,
            account_number,
            phone,
            address
          ),
          team_members (
            name,
            email
          )
        `);

      // Apply filters
      if (query) {
        appointmentsQuery = appointmentsQuery.or(`notes.ilike.%${query}%,service_type.ilike.%${query}%`);
      }

      if (startDate) {
        appointmentsQuery = appointmentsQuery.gte('scheduled_date', startDate);
      }

      if (endDate) {
        appointmentsQuery = appointmentsQuery.lte('scheduled_date', endDate);
      }

      if (status.length > 0) {
        appointmentsQuery = appointmentsQuery.in('status', status);
      }

      if (serviceType.length > 0) {
        appointmentsQuery = appointmentsQuery.in('service_type', serviceType);
      }

      if (technician) {
        appointmentsQuery = appointmentsQuery.eq('technician_id', technician);
      }

      // Add pagination for specific appointment search
      if (type === 'appointments') {
        appointmentsQuery = appointmentsQuery.range(offset, offset + limit - 1);
      }

      const { data: appointments } = await appointmentsQuery.order('scheduled_date', { ascending: false });
      results.appointments = appointments || [];
    }

    // Search invoices
    if (type === 'all' || type === 'invoices') {
      let invoicesQuery = supabase
        .from('invoices')
        .select(`
          invoice_id,
          customer_id,
          invoice_number,
          amount,
          status,
          due_date,
          created_at,
          description,
          customers (
            name,
            account_number,
            email,
            phone
          ),
          payments (
            payment_id,
            amount,
            payment_date,
            method
          )
        `);

      // Apply filters
      if (query) {
        invoicesQuery = invoicesQuery.or(`invoice_number.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (startDate) {
        invoicesQuery = invoicesQuery.gte('created_at', startDate);
      }

      if (endDate) {
        invoicesQuery = invoicesQuery.lte('created_at', endDate);
      }

      if (status.length > 0) {
        invoicesQuery = invoicesQuery.in('status', status);
      }

      if (minAmount > 0) {
        invoicesQuery = invoicesQuery.gte('amount', minAmount);
      }

      if (maxAmount > 0) {
        invoicesQuery = invoicesQuery.lte('amount', maxAmount);
      }

      // Add pagination for specific invoice search
      if (type === 'invoices') {
        invoicesQuery = invoicesQuery.range(offset, offset + limit - 1);
      }

      const { data: invoices } = await invoicesQuery.order('created_at', { ascending: false });
      results.invoices = invoices || [];
    }

    // Calculate total results
    results.total = results.customers.length + results.appointments.length + results.invoices.length;

    // For 'all' searches, limit combined results
    if (type === 'all') {
      const allResults = [
        ...results.customers.map(item => ({ ...item, _type: 'customer' })),
        ...results.appointments.map(item => ({ ...item, _type: 'appointment' })),
        ...results.invoices.map(item => ({ ...item, _type: 'invoice' }))
      ];

      // Sort by most recent first
      allResults.sort((a, b) => new Date(b.created_at || b.scheduled_date).getTime() - new Date(a.created_at || a.scheduled_date).getTime());

      // Apply pagination to combined results
      const paginatedResults = allResults.slice(offset, offset + limit);

      return NextResponse.json({
        success: true,
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: allResults.length,
          totalPages: Math.ceil(allResults.length / limit)
        },
        breakdown: {
          customers: results.customers.length,
          appointments: results.appointments.length,
          invoices: results.invoices.length
        }
      });
    }

    // Return specific type results
    const typeData = results[type as keyof typeof results];
    
    return NextResponse.json({
      success: true,
      data: typeData,
      pagination: {
        page,
        limit,
        total: Array.isArray(typeData) ? typeData.length : 0,
        totalPages: Math.ceil((Array.isArray(typeData) ? typeData.length : 0) / limit)
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, type = 'all' } = body;

    const supabase = createRouteHandlerClient({ cookies });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Advanced search with complex filters
    const results = [];

    // Build complex queries based on filters
    if (type === 'all' || type === 'customers') {
      const customerResults = await performAdvancedCustomerSearch(supabase, query, filters);
      results.push(...customerResults.map(item => ({ ...item, _type: 'customer' })));
    }

    if (type === 'all' || type === 'appointments') {
      const appointmentResults = await performAdvancedAppointmentSearch(supabase, query, filters);
      results.push(...appointmentResults.map(item => ({ ...item, _type: 'appointment' })));
    }

    if (type === 'all' || type === 'invoices') {
      const invoiceResults = await performAdvancedInvoiceSearch(supabase, query, filters);
      results.push(...invoiceResults.map(item => ({ ...item, _type: 'invoice' })));
    }

    // Sort and paginate results
    results.sort((a, b) => new Date(b.created_at || b.scheduled_date).getTime() - new Date(a.created_at || a.scheduled_date).getTime());

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total: results.length,
        totalPages: Math.ceil(results.length / limit)
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { error: 'Advanced search failed', details: error.message },
      { status: 500 }
    );
  }
}

async function performAdvancedCustomerSearch(supabase: any, query: string, filters: any) {
  let customersQuery = supabase
    .from('customers')
    .select(`
      *,
      devices (
        device_id,
        device_type,
        location,
        installation_date,
        last_test_date
      ),
      test_reports (
        test_id,
        test_date,
        status,
        compliance_status
      ),
      invoices (
        invoice_id,
        amount,
        status,
        due_date
      )
    `);

  if (query) {
    customersQuery = customersQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,account_number.ilike.%${query}%,address.ilike.%${query}%`);
  }

  // Apply advanced filters
  if (filters.hasOverduePayments) {
    // This would need to be a more complex query or post-processing
  }

  if (filters.needsService) {
    // Filter customers whose devices need testing
  }

  const { data: customers } = await customersQuery.order('created_at', { ascending: false });
  return customers || [];
}

async function performAdvancedAppointmentSearch(supabase: any, query: string, filters: any) {
  let appointmentsQuery = supabase
    .from('appointments')
    .select(`
      *,
      customers (
        name,
        account_number,
        phone,
        address,
        email
      ),
      team_members (
        name,
        email,
        phone
      )
    `);

  if (query) {
    appointmentsQuery = appointmentsQuery.or(`notes.ilike.%${query}%,service_type.ilike.%${query}%`);
  }

  const { data: appointments } = await appointmentsQuery.order('scheduled_date', { ascending: false });
  return appointments || [];
}

async function performAdvancedInvoiceSearch(supabase: any, query: string, filters: any) {
  let invoicesQuery = supabase
    .from('invoices')
    .select(`
      *,
      customers (
        name,
        account_number,
        email,
        phone,
        address
      ),
      payments (
        payment_id,
        amount,
        payment_date,
        method,
        status
      )
    `);

  if (query) {
    invoicesQuery = invoicesQuery.or(`invoice_number.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data: invoices } = await invoicesQuery.order('created_at', { ascending: false });
  return invoices || [];
}