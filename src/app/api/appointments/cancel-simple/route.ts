import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, customerId, reason } = await request.json();
    
    if (!appointmentId || !customerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update appointment status to cancelled
    const { data, error } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('customer_id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Cancel error:', error);
      return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: data
    });

  } catch (error) {
    console.error('Cancel API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}