import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Get current date and calculate next 30 days
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    // Query appointments for the next 30 days to check availability
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('scheduled_date, scheduled_time_start, estimated_duration')
      .gte('scheduled_date', today.toISOString().split('T')[0])
      .lte('scheduled_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .neq('status', 'cancelled');
    
    if (error) {
      console.error('Error fetching appointments:', error);
    }
    
    // Generate available dates (excluding weekends and considering existing appointments)
    const availableDates = [];
    const currentDate = new Date(today);
    
    // Skip today and start from tomorrow
    currentDate.setDate(currentDate.getDate() + 1);
    
    while (availableDates.length < 15 && currentDate <= thirtyDaysFromNow) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if this date has availability (max 8 appointments per day)
        const appointmentsOnDate = existingAppointments?.filter(
          apt => apt.scheduled_date === dateString
        ).length || 0;
        
        // Only include if less than 8 appointments already scheduled
        if (appointmentsOnDate < 8) {
          availableDates.push(dateString);
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return NextResponse.json({
      success: true,
      dates: availableDates,
      info: 'Available weekdays with appointment capacity'
    });
    
  } catch (error) {
    console.error('Available dates API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}