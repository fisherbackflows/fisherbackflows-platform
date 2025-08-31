import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    
    // Get next 30 days of availability
    const today = new Date();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(today.getDate() + 30);
    
    // Get existing appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_date, scheduled_time')
      .gte('scheduled_date', today.toISOString().split('T')[0])
      .lte('scheduled_date', thirtyDaysOut.toISOString().split('T')[0])
      .not('status', 'eq', 'cancelled');

    // Generate available dates (excluding weekends)
    const availableDates: string[] = [];
    for (let d = new Date(today); d <= thirtyDaysOut; d.setDate(d.getDate() + 1)) {
      // Skip weekends
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        availableDates.push(d.toISOString().split('T')[0]);
      }
    }

    // Calculate availability for each date
    const availability = availableDates.map(date => {
      const dayAppointments = appointments?.filter(apt => apt.scheduled_date === date) || [];
      const slotsBooked = dayAppointments.length;
      const maxSlots = 8; // 8 appointments per day
      
      return {
        date,
        available: maxSlots - slotsBooked > 0,
        slotsRemaining: Math.max(0, maxSlots - slotsBooked),
        slotsTotal: maxSlots
      };
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}