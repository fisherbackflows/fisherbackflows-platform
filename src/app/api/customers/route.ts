import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician', 'tester'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since customers table doesn't exist yet, return mock data based on team_users
    const supabase = createRouteHandlerClient(request);
    const { data: teamUsers, error } = await supabase
      .from('team_users')
      .select('*')
      .order('first_name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Convert team users to mock customers for now
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
      devices: [] // No devices table yet
    })) || [];

    return NextResponse.json({ 
      customers: mockCustomers,
      note: 'Using team_users as mock customer data until migration is applied'
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

    // Generate account number if not provided
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