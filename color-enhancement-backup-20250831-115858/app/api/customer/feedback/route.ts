import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CustomerFeedback } from '@/lib/feedback';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const feedbackData: Omit<CustomerFeedback, 'id' | 'createdAt' | 'updatedAt'> = await request.json();

    // Validate required fields
    if (!feedbackData.customerId || !feedbackData.type || !feedbackData.overallRating) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert feedback into database
    const { data, error } = await supabase
      .from('customer_feedback')
      .insert({
        customer_id: feedbackData.customerId,
        appointment_id: feedbackData.appointmentId,
        technician_id: feedbackData.technicianId,
        feedback_type: feedbackData.type,
        overall_rating: feedbackData.overallRating,
        responses: feedbackData.responses,
        additional_comments: feedbackData.additionalComments,
        is_anonymous: feedbackData.isAnonymous,
        status: feedbackData.status,
        priority: feedbackData.priority,
        tags: feedbackData.tags,
        follow_up_required: feedbackData.followUpRequired,
        metadata: feedbackData.metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // Log the feedback submission for audit purposes
    try {
      await supabase.from('audit_logs').insert({
        event_type: 'customer_feedback_submitted',
        user_id: feedbackData.customerId,
        entity_type: 'feedback',
        entity_id: data.id,
        metadata: {
          feedback_type: feedbackData.type,
          overall_rating: feedbackData.overallRating,
          priority: feedbackData.priority,
          is_anonymous: feedbackData.isAnonymous,
          appointment_id: feedbackData.appointmentId,
          technician_id: feedbackData.technicianId
        },
        severity: 'low',
        success: true
      });
    } catch (logError) {
      console.error('Failed to log feedback submission:', logError);
      // Don't fail the request if logging fails
    }

    // If feedback is high priority, create a follow-up task
    if (feedbackData.priority === 'urgent' || feedbackData.priority === 'high') {
      try {
        // This would integrate with a task management system
        // For now, just log it as a high-priority audit event
        await supabase.from('audit_logs').insert({
          event_type: 'high_priority_feedback_alert',
          user_id: null,
          entity_type: 'feedback',
          entity_id: data.id,
          metadata: {
            feedback_id: data.id,
            customer_id: feedbackData.customerId,
            priority: feedbackData.priority,
            type: feedbackData.type,
            rating: feedbackData.overallRating
          },
          severity: 'high',
          success: true
        });
      } catch (alertError) {
        console.error('Failed to create priority alert:', alertError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        message: 'Feedback submitted successfully'
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const appointmentId = searchParams.get('appointmentId');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('customer_feedback')
      .select('*')
      .eq('customer_id', customerId);

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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
      metadata: item.metadata || { source: 'web' }
    }));

    return NextResponse.json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Feedback fetch error:', error);
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