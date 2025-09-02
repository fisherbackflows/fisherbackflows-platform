import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, serviceType = 'Annual Test', priority = 'medium', preferredDays = [] } = body;
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Get customer information for context
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('first_name, last_name, company_name, preferred_time_slots')
      .eq('id', customerId)
      .single();

    if (customerError) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get existing appointments for the next 30 days to check availability
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const { data: existingAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('scheduled_date, scheduled_time_start, estimated_duration')
      .gte('scheduled_date', today.toISOString().split('T')[0])
      .lte('scheduled_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .neq('status', 'cancelled');

    if (appointmentError) {
      console.error('Error fetching appointments:', appointmentError);
    }

    // Define time slots with priority weighting
    const timeSlots = [
      { time: '09:00:00', label: '9:00 AM', priority: priority === 'high' ? 3 : 1 },
      { time: '10:00:00', label: '10:00 AM', priority: 2 },
      { time: '11:00:00', label: '11:00 AM', priority: 2 },
      { time: '13:00:00', label: '1:00 PM', priority: 1 },
      { time: '14:00:00', label: '2:00 PM', priority: 2 },
      { time: '15:00:00', label: '3:00 PM', priority: priority === 'high' ? 1 : 3 },
      { time: '16:00:00', label: '4:00 PM', priority: 1 }
    ];

    // Sort time slots by priority (higher priority first)
    const prioritizedSlots = timeSlots.sort((a, b) => b.priority - a.priority);

    // Find the next available slot
    const currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

    let foundSlot = null;
    let daysChecked = 0;
    const maxDaysToCheck = 30;

    while (!foundSlot && daysChecked < maxDaysToCheck) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends unless preferred
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check daily capacity (max 8 appointments)
        const appointmentsOnDate = existingAppointments?.filter(
          apt => apt.scheduled_date === dateString
        ).length || 0;

        if (appointmentsOnDate < 8) {
          // Check each time slot for availability
          for (const slot of prioritizedSlots) {
            const hasConflict = existingAppointments?.some(apt => {
              if (apt.scheduled_date !== dateString || !apt.scheduled_time_start) return false;
              
              const aptTime = apt.scheduled_time_start;
              const aptDuration = apt.estimated_duration || 60;
              
              // Parse appointment time
              const [aptHour, aptMinute] = aptTime.substring(0, 5).split(':').map(Number);
              const aptStartMinutes = aptHour * 60 + aptMinute;
              const aptEndMinutes = aptStartMinutes + aptDuration;
              
              // Parse slot time
              const [slotHour, slotMinute] = slot.time.substring(0, 5).split(':').map(Number);
              const slotStartMinutes = slotHour * 60 + slotMinute;
              const slotEndMinutes = slotStartMinutes + 60; // Default 1 hour
              
              // Check for overlap
              return slotStartMinutes < aptEndMinutes && slotEndMinutes > aptStartMinutes;
            });

            if (!hasConflict) {
              // Check if this matches customer preferences
              const customerPrefs = customer.preferred_time_slots || [];
              const matchesPreference = customerPrefs.length === 0 || 
                customerPrefs.some(pref => slot.time.includes(pref));

              foundSlot = {
                date: dateString,
                time: slot.time,
                timeLabel: slot.label,
                matchesPreference,
                daysOut: daysChecked + 1
              };
              break;
            }
          }
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }

    if (!foundSlot) {
      return NextResponse.json({
        success: false,
        error: 'No available slots found in the next 30 days',
        suggestions: [
          'Check for cancellations',
          'Consider expanding business hours', 
          'Add additional service days'
        ]
      }, { status: 404 });
    }

    // Optionally auto-book if this is an immediate booking request
    if (body.autoBook) {
      const bookingResponse = await fetch(`${request.url.replace('/next-available', '/book')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          date: foundSlot.date,
          time: foundSlot.timeLabel,
          serviceType,
          notes: `Quick-booked via next available slot (${priority} priority)`
        })
      });

      if (bookingResponse.ok) {
        const bookingResult = await bookingResponse.json();
        if (bookingResult.success) {
          return NextResponse.json({
            success: true,
            appointment: {
              id: bookingResult.appointment.id,
              customerId,
              customerName: customer.company_name || `${customer.first_name} ${customer.last_name}`,
              date: foundSlot.date,
              time: foundSlot.timeLabel,
              serviceType,
              priority,
              autoBooked: true
            },
            message: `Appointment automatically booked for ${foundSlot.timeLabel} on ${new Date(foundSlot.date).toLocaleDateString()}`
          });
        }
      }
    }

    // Return available slot information
    return NextResponse.json({
      success: true,
      nextAvailable: {
        date: foundSlot.date,
        time: foundSlot.time,
        timeLabel: foundSlot.timeLabel,
        daysOut: foundSlot.daysOut,
        matchesPreference: foundSlot.matchesPreference
      },
      customer: {
        name: customer.company_name || `${customer.first_name} ${customer.last_name}`,
        preferences: customer.preferred_time_slots || []
      },
      message: `Next available slot: ${foundSlot.timeLabel} on ${new Date(foundSlot.date).toLocaleDateString()}`
    });
    
  } catch (error) {
    console.error('Next available API error:', error);
    return NextResponse.json({ 
      error: 'Server error finding next available slot' 
    }, { status: 500 });
  }
}