import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const timeSlot = searchParams.get('time');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);
    
    // Get all active technicians
    const { data: technicians, error: techError } = await supabase
      .from('team_users')
      .select('id, first_name, last_name, email, role')
      .eq('is_active', true)
      .in('role', ['technician', 'admin']); // Admin can also do tests

    if (techError) {
      console.error('Error fetching technicians:', techError);
      return NextResponse.json(
        { error: 'Failed to fetch technicians' },
        { status: 500 }
      );
    }

    if (!timeSlot) {
      // Return all technicians if no time specified
      return NextResponse.json({
        success: true,
        date: date,
        technicians: technicians || []
      });
    }

    // Check technician availability for specific date/time
    const { data: existingAppointments, error: apptError } = await supabase
      .from('appointments')
      .select('technician_id, scheduled_time_start, estimated_duration')
      .eq('scheduled_date', date)
      .neq('status', 'cancelled');

    if (apptError) {
      console.error('Error checking appointments:', apptError);
    }

    // Filter technicians based on availability
    const availableTechnicians = (technicians || []).filter(tech => {
      // Check if technician has conflicting appointment
      const hasConflict = (existingAppointments || []).some(apt => {
        if (apt.technician_id !== tech.id) return false;
        
        if (!apt.scheduled_time_start) return false;
        
        // Parse times and check for overlap
        const aptStart = apt.scheduled_time_start.substring(0, 5); // HH:MM
        const aptDuration = apt.estimated_duration || 60;
        
        const [aptHour, aptMin] = aptStart.split(':').map(Number);
        const [slotHour, slotMin] = timeSlot.split(':').map(Number);
        
        const aptStartMinutes = aptHour * 60 + aptMin;
        const aptEndMinutes = aptStartMinutes + aptDuration;
        const slotStartMinutes = slotHour * 60 + slotMin;
        const slotEndMinutes = slotStartMinutes + 60; // Assume 1 hour slot
        
        // Check for overlap
        return slotStartMinutes < aptEndMinutes && slotEndMinutes > aptStartMinutes;
      });
      
      return !hasConflict;
    });

    return NextResponse.json({
      success: true,
      date: date,
      time: timeSlot,
      technicians: availableTechnicians,
      totalTechnicians: technicians?.length || 0,
      availableCount: availableTechnicians.length
    });

  } catch (error) {
    console.error('Available technicians API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}