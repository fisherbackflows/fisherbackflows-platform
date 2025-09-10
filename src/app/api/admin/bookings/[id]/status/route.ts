import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const StatusUpdateSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = StatusUpdateSchema.parse(body);

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

    // Update the appointment status
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment status:', error);
      return NextResponse.json(
        { error: 'Failed to update appointment status' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Log the status change for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'appointments',
        record_id: bookingId,
        action: 'UPDATE',
        old_values: { status: data.status },
        new_values: { status: validatedData.status },
        user_id: 'admin', // In a real implementation, get this from auth
        timestamp: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      appointment: data,
      message: `Appointment status updated to ${validatedData.status}`
    });

  } catch (error) {
    console.error('Status update API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid status provided',
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