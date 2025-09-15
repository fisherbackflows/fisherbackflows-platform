import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';
import { CustomerFeedback } from '@/lib/feedback';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const rating = searchParams.get('rating');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const technicianId = searchParams.get('technicianId');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('customer_feedback')
      .select(`
        *,
        customer:customers(name, email),
        appointment:appointments(scheduled_date, service_type),
        technician:team_members(name)
      `);

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (type) {
      query = query.eq('feedback_type', type);
    }
    if (rating) {
      query = query.eq('overall_rating', parseInt(rating));
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (technicianId) {
      query = query.eq('technician_id', technicianId);
    }

    query = query.order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Transform database format to application format
    const feedback: CustomerFeedback[] = (data || []).map(item => ({
      id: item.id,
      customerId: item.customer_id,
      appointmentId: item.appointment_id,
      technicianId: item.technician_id,
      type: item.feedback_type,
      overallRating: item.overall_rating,
      responses: item.responses || [],
      additionalComments: item.additional_comments,
      isAnonymous: item.is_anonymous,
      status: item.status,
      priority: item.priority,
      tags: item.tags || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      resolution: item.resolution,
      followUpRequired: item.follow_up_required,
      metadata: {
        ...item.metadata,
        customerName: item.customer?.name,
        customerEmail: item.customer?.email,
        appointmentDate: item.appointment?.scheduled_date,
        serviceType: item.appointment?.service_type,
        technicianName: item.technician?.name
      }
    }));

    return NextResponse.json({
      success: true,
      feedback,
      count: feedback.length
    });

  } catch (error) {
    console.error('Admin feedback fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { feedbackId, status, reviewedBy, resolution } = await request.json();

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }
    if (reviewedBy) {
      updateData.reviewed_by = reviewedBy;
      updateData.reviewed_at = new Date().toISOString();
    }
    if (resolution) {
      updateData.resolution = resolution;
    }

    const { data, error } = await supabase
      .from('customer_feedback')
      .update(updateData)
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    // Log the update for audit purposes
    try {
      await supabase.from('audit_logs').insert({
        event_type: 'feedback_status_updated',
        user_id: reviewedBy,
        entity_type: 'feedback',
        entity_id: feedbackId,
        metadata: {
          old_status: 'unknown', // Would need to fetch previous status
          new_status: status,
          resolution: resolution,
          updated_by: reviewedBy
        },
        severity: 'low',
        success: true
      });
    } catch (logError) {
      console.error('Failed to log feedback update:', logError);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Feedback updated successfully'
    });

  } catch (error) {
    console.error('Feedback update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('feedbackId');

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('customer_feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete feedback' },
        { status: 500 }
      );
    }

    // Log the deletion for audit purposes
    try {
      await supabase.from('audit_logs').insert({
        event_type: 'feedback_deleted',
        user_id: null, // Would come from auth
        entity_type: 'feedback',
        entity_id: feedbackId,
        metadata: {
          deleted_feedback_id: feedbackId,
          action: 'delete'
        },
        severity: 'medium',
        success: true
      });
    } catch (logError) {
      console.error('Failed to log feedback deletion:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Feedback deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}