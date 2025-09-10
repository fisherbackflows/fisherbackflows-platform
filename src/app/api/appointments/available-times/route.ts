import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { AvailabilityCache, CacheTTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Use caching for available times with shorter TTL for more real-time accuracy
    const result = await AvailabilityCache.cacheAvailableTimes(date, async () => {
      const supabase = supabaseAdmin || createRouteHandlerClient(request);
      
      // Get existing appointments for the specified date
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('scheduled_time_start, estimated_duration')
        .eq('scheduled_date', date)
        .neq('status', 'cancelled');
      
      if (error) {
        console.error('Error fetching appointments for date:', error);
      }
      
      // Define business hours and time slots (9 AM to 4 PM)
      const timeSlots = [
        { time: '09:00', label: '9:00 AM', value: '09:00:00' },
        { time: '10:00', label: '10:00 AM', value: '10:00:00' },
        { time: '11:00', label: '11:00 AM', value: '11:00:00' },
        { time: '13:00', label: '1:00 PM', value: '13:00:00' },
        { time: '14:00', label: '2:00 PM', value: '14:00:00' },
        { time: '15:00', label: '3:00 PM', value: '15:00:00' },
        { time: '16:00', label: '4:00 PM', value: '16:00:00' }
      ];
      
      // Check availability for each time slot
      const availableSlots = timeSlots.filter(slot => {
        const slotTime = slot.time;
        
        // Check if this time slot conflicts with existing appointments
        const hasConflict = existingAppointments?.some(apt => {
          if (!apt.scheduled_time_start) return false;
          
          // Parse the appointment time
          const aptTime = apt.scheduled_time_start.substring(0, 5); // Get HH:MM format
          const aptDuration = apt.estimated_duration || 60;
          
          // Calculate appointment end time
          const [aptHour, aptMinute] = aptTime.split(':').map(Number);
          const aptStartMinutes = aptHour * 60 + aptMinute;
          const aptEndMinutes = aptStartMinutes + aptDuration;
          
          // Parse slot time
          const [slotHour, slotMinute] = slotTime.split(':').map(Number);
          const slotStartMinutes = slotHour * 60 + slotMinute;
          const slotEndMinutes = slotStartMinutes + 60; // Assume 1 hour slots
          
          // Check for overlap: slot starts before apt ends AND slot ends after apt starts
          return slotStartMinutes < aptEndMinutes && slotEndMinutes > aptStartMinutes;
        });
        
        return !hasConflict;
      });
      
      return {
        success: true,
        date: date,
        availableSlots: availableSlots,
        totalSlots: timeSlots.length,
        bookedSlots: timeSlots.length - availableSlots.length,
        cached: false,
        timestamp: new Date().toISOString()
      };
    });

    // Add cache hit indicator
    const response = {
      ...result,
      cached: result.cached !== false
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Available times API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}