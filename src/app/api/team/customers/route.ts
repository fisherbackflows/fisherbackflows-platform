import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';
import { validateSession } from '@/lib/auth-security';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Use tester portal session authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('team_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        customers: [],
        count: 0
      }, { status: 401 });
    }

    const sessionValidation = await validateSession(sessionToken);
    if (!sessionValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Session expired',
        customers: [],
        count: 0
      }, { status: 401 });
    }

    // CRITICAL SECURITY FIX: Verify user role authorization
    if (!['admin', 'tester'].includes(sessionValidation.role)) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
        customers: [],
        count: 0
      }, { status: 403 });
    }

    // CRITICAL SECURITY FIX: Get user's company for data isolation
    const userCompanyId = sessionValidation.companyId;
    if (!userCompanyId) {
      return NextResponse.json({
        success: false,
        error: 'Company access required',
        customers: [],
        count: 0
      }, { status: 400 });
    }

    const supabase = createRouteHandlerClient(request);

    // CRITICAL SECURITY FIX: Fetch customers filtered by company
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        company_name,
        first_name,
        last_name,
        email,
        phone,
        street_address,
        city,
        state,
        zip_code,
        account_status,
        last_test_date,
        next_test_due,
        devices:devices(
          id,
          device_type,
          manufacturer,
          model,
          location_description,
          device_status,
          next_test_due
        )
      `)
      .eq('company_id', userCompanyId)
      .order('last_name');

    if (customerError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to load customers',
        customers: [],
        count: 0
      }, { status: 500 });
    }

    // Transform data to match tester portal interface expectations
    const transformedCustomers = customers?.map(customer => ({
      id: customer.id,
      name: customer.company_name || `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      address: customer.street_address || '',
      city: customer.city || '',
      state: customer.state || 'WA',
      zip: customer.zip_code || '',
      lastTestDate: customer.last_test_date || null,
      nextTestDue: customer.next_test_due || null,
      status: customer.account_status === 'active' ? 'current' : 'inactive',
      deviceCount: customer.devices?.length || 0,
      totalPaid: 0 // This would need to be calculated from payments/invoices
    })) || [];

    return NextResponse.json({
      success: true,
      customers: transformedCustomers,
      count: transformedCustomers.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error',
      customers: [],
      count: 0
    }, { status: 500 });
  }
}