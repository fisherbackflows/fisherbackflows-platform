import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        scheduled_date,
        scheduled_time_start,
        status,
        appointment_type,
        created_at,
        customers (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('List appointments error:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      appointments: appointments || [],
      count: appointments?.length || 0
    });

  } catch (error) {
    console.error('List API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}