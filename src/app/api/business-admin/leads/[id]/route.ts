import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Lead not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching lead:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient(request);
    const body = await request.json();
    
    // Build update object
    const updateData: any = {
      first_name: body.first_name,
      last_name: body.last_name,
      company_name: body.company_name,
      email: body.email,
      phone: body.phone,
      address: body.address_line1,
      city: body.city,
      state: body.state,
      zip_code: body.zip_code,
      source: body.source,
      status: body.status,
      estimated_value: body.estimated_value,
      notes: body.notes,
      assigned_to: body.assigned_to,
      updated_at: new Date().toISOString()
    };

    // Set status-specific date fields
    if (body.status === 'contacted' && body.contacted_date) {
      updateData.contacted_date = body.contacted_date;
    }
    if (body.status === 'qualified' && body.qualified_date) {
      updateData.qualified_date = body.qualified_date;
    }
    if (body.status === 'converted' && body.converted_date) {
      updateData.converted_date = body.converted_date;
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    // Log activity
    try {
      const activitySupabase = createRouteHandlerClient(request);
      await activitySupabase
        .from('lead_activity')
        .insert([{
          lead_id: params.id,
          action: 'updated',
          details: `Lead profile updated`,
          user: 'System',
          created_at: new Date().toISOString()
        }]);
    } catch (activityError) {
      // Don't fail the main operation if activity logging fails
      console.warn('Failed to log activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      lead
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}