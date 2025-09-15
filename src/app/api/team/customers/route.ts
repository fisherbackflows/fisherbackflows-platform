import { NextRequest, NextResponse } from 'next/server';
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

    const supabase = createRouteHandlerClient(request);
    
    console.log('🔍 Tester Portal: Fetching customers from database...');
    
    // Fetch real customers from the database
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
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
      .order('last_name');

    if (customerError) {
      console.error('Customer database error:', customerError);
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

    console.log(`📊 Tester Portal: Loaded ${transformedCustomers.length} real customers`);

    return NextResponse.json({ 
      success: true,
      customers: transformedCustomers,
      count: transformedCustomers.length
    });
  } catch (error) {
    console.error('Team API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      customers: [],
      count: 0
    }, { status: 500 });
  }
}