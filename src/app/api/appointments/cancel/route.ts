import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const CancelSchema = z.object({
  appointmentId: z.string().uuid(),
  customerId: z.string().uuid(),
  reason: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = CancelSchema.parse(body);
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if appointment exists and belongs to customer
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        scheduled_date,
        scheduled_time,
        status,
        service_type,
        customer_notes,
        customers!customer_id (
          name,
          email
        ),
        devices!device_id (
          location,
          device_type
        )
      `)
      .eq('id', validatedData.appointmentId)
      .eq('customer_id', validatedData.customerId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    // Check if appointment can be cancelled (must be at least 24 hours in advance)
    const appointmentDateTime = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return NextResponse.json(
        { 
          error: 'Appointments can only be cancelled at least 24 hours in advance',
          canCancel: false,
          hoursRemaining: Math.round(hoursDifference)
        },
        { status: 400 }
      );
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Completed appointments cannot be cancelled' },
        { status: 400 }
      );
    }

    // Update appointment status to cancelled
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        customer_notes: `${appointment.customer_notes || ''}\nCancelled by customer${validatedData.reason ? `: ${validatedData.reason}` : ''}`.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.appointmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 }
      );
    }

    // Log the cancellation for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'appointments',
        record_id: validatedData.appointmentId,
        action: 'UPDATE',
        old_values: { status: appointment.status },
        new_values: { 
          status: 'cancelled',
          cancelled_by: 'customer',
          cancellation_reason: validatedData.reason
        },
        user_id: validatedData.customerId,
        timestamp: new Date().toISOString()
      });

    // Send cancellation notification email (optional)
    try {
      const appointmentDate = new Date(appointment.scheduled_date).toLocaleDateString();
      const appointmentTime = appointment.scheduled_time;
      
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: appointment.customers?.[0]?.email,
          subject: 'Appointment Cancelled - Fisher Backflows',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Appointment Cancelled</h2>
              <p>Hello ${appointment.customers?.[0]?.name},</p>
              <p>Your backflow testing appointment has been cancelled:</p>
              <ul>
                <li><strong>Date:</strong> ${appointmentDate}</li>
                <li><strong>Time:</strong> ${appointmentTime}</li>
                <li><strong>Service:</strong> ${appointment.service_type}</li>
                <li><strong>Device:</strong> ${appointment.devices?.device_type} at ${appointment.devices?.location}</li>
              </ul>
              ${validatedData.reason ? `<p><strong>Reason:</strong> ${validatedData.reason}</p>` : ''}
              <p>If you need to reschedule, please visit your customer portal or contact us.</p>
              <p>Thank you,<br>Fisher Backflows Team</p>
            </div>
          `
        })
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment cancelled successfully',
      refundEligible: hoursDifference >= 48 // Example business rule
    });

  } catch (error) {
    console.error('Cancel appointment API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid cancellation data provided',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}