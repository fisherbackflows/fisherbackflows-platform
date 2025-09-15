import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician', 'tester'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient(request);
    
    console.log('🔍 Attempting to fetch customers from database...');
    
    // Try to get real customers first
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

    console.log('📊 Customer query result:', { 
      customerCount: customers?.length || 0, 
      hasError: !!customerError,
      errorMessage: customerError?.message 
    });

    if (customerError) {
      console.error('Customer database error:', customerError);
      console.error('Customer error details:', JSON.stringify(customerError, null, 2));
      
      // Fallback to mock data if customers table issues
      const { data: teamUsers, error: teamError } = await supabase
        .from('team_users')
        .select('*')
        .order('first_name');

      if (teamError) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      const mockCustomers = teamUsers?.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company_name: `${user.first_name} ${user.last_name} Company`,
        phone: user.phone || '(555) 123-4567',
        account_number: `FB-${user.id.slice(0, 6).toUpperCase()}`,
        account_status: 'active',
        created_at: user.created_at,
        devices: []
      })) || [];

      return NextResponse.json({ 
        customers: mockCustomers,
        note: 'Fallback: Using team_users as mock customer data',
        usingMockData: true
      });
    }

    return NextResponse.json({ 
      customers: customers || [],
      count: customers?.length || 0,
      usingMockData: false
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createRouteHandlerClient(request);

    // Check if this is a bulk import
    if (body.bulk && Array.isArray(body.customers)) {
      const customersToInsert = body.customers.map((customer: any) => ({
        ...customer,
        account_number: customer.account_number || `FB${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        account_status: customer.account_status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data: customers, error } = await supabase
        .from('customers')
        .insert(customersToInsert)
        .select();

      if (error) {
        console.error('Bulk insert error:', error);
        return NextResponse.json({ 
          error: 'Failed to import customers', 
          details: error.message 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        message: `Successfully imported ${customers?.length || 0} customers`,
        customers,
        imported: customers?.length || 0
      }, { status: 201 });
    }

    // Single customer creation
    if (!body.account_number) {
      body.account_number = `FB${Date.now()}`;
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}