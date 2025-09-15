import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get basic counts
    const [customersResponse, appointmentsResponse, invoicesResponse] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact' }),
      supabase.from('appointments').select('id', { count: 'exact' }),
      supabase.from('invoices').select('amount').limit(100)
    ]);

    const customers = customersResponse.count || 0;
    const appointments = appointmentsResponse.count || 0;
    
    // Calculate total revenue from invoices
    const revenue = invoicesResponse.data?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0;

    // Get recent appointments with customer names
    const { data: recentAppointments } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_date,
        status,
        customers (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    const formattedAppointments = recentAppointments?.map(apt => ({
      id: apt.id,
      customer_name: apt.customers ? `${apt.customers.first_name} ${apt.customers.last_name}` : 'Unknown',
      scheduled_date: new Date(apt.scheduled_date).toLocaleDateString(),
      status: apt.status
    })) || [];

    return NextResponse.json({
      success: true,
      customers,
      appointments,
      revenue,
      recentAppointments: formattedAppointments
    });

  } catch (error) {
    console.error('Simple metrics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}