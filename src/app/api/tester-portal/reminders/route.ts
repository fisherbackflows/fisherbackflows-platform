import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

async function checkPermissions(request: NextRequest) {
  const cookies = request.cookies;
  const teamSession = cookies.get('team_session')?.value;
  
  if (!teamSession) {
    return { hasAccess: false, isOwner: false, user: null };
  }
  
  try {
    const { data: session } = await supabaseAdmin
      .from('team_sessions')
      .select(`
        team_user_id,
        expires_at,
        team_users (
          id, email, role, is_active
        )
      `)
      .eq('session_token', teamSession)
      .gt('expires_at', new Date().toISOString())
      .single();
      
    if (!session?.team_users) {
      return { hasAccess: false, isOwner: false, user: null };
    }
    
    const user = session.team_users as any;
    const isOwner = user.email === 'blake@fisherbackflows.com' || user.role === 'admin';
    
    return { hasAccess: true, isOwner, user };
  } catch (error) {
    return { hasAccess: false, isOwner: false, user: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires communications subscription' 
      }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'rules', 'history', or 'scheduled'
    
    if (type === 'rules') {
      // Get reminder rules
      const { data: rules, error } = await supabaseAdmin
        .from('reminder_rules')
        .select(`
          id,
          name,
          description,
          trigger_type,
          trigger_conditions,
          message_template,
          channels,
          is_active,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch reminder rules'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        rules: rules || []
      });
      
    } else if (type === 'history') {
      // Get sent reminders history
      const { data: history, error } = await supabaseAdmin
        .from('sent_reminders')
        .select(`
          id,
          customer_id,
          rule_id,
          channel,
          sent_at,
          status,
          message_content,
          error_message,
          customers (
            id,
            name,
            email,
            phone
          ),
          reminder_rules (
            id,
            name
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch reminder history'
        }, { status: 500 });
      }

      const transformedHistory = (history || []).map(item => ({
        id: item.id,
        customerId: item.customer_id,
        customerName: item.customers?.name || 'Unknown Customer',
        customerEmail: item.customers?.email || '',
        customerPhone: item.customers?.phone || '',
        ruleName: item.reminder_rules?.name || 'Unknown Rule',
        channel: item.channel,
        sentAt: item.sent_at,
        status: item.status,
        messageContent: item.message_content,
        errorMessage: item.error_message
      }));

      return NextResponse.json({
        success: true,
        history: transformedHistory
      });
      
    } else {
      // Get scheduled reminders
      const { data: scheduled, error } = await supabaseAdmin
        .from('scheduled_reminders')
        .select(`
          id,
          customer_id,
          rule_id,
          scheduled_for,
          channel,
          message_content,
          status,
          customers (
            id,
            name,
            email,
            phone
          ),
          reminder_rules (
            id,
            name
          )
        `)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch scheduled reminders'
        }, { status: 500 });
      }

      const transformedScheduled = (scheduled || []).map(item => ({
        id: item.id,
        customerId: item.customer_id,
        customerName: item.customers?.name || 'Unknown Customer',
        ruleName: item.reminder_rules?.name || 'Unknown Rule',
        scheduledFor: item.scheduled_for,
        channel: item.channel,
        messageContent: item.message_content,
        status: item.status
      }));

      return NextResponse.json({
        success: true,
        scheduled: transformedScheduled
      });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires communications subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      name,
      description,
      trigger_type,
      trigger_conditions,
      message_template,
      channels
    } = body;
    
    // Create new reminder rule
    const { data: rule, error } = await supabaseAdmin
      .from('reminder_rules')
      .insert({
        name,
        description: description || '',
        trigger_type,
        trigger_conditions: trigger_conditions || {},
        message_template,
        channels: channels || ['email'],
        is_active: true,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create reminder rule'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rule,
      message: 'Reminder rule created successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires communications subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Rule ID required'
      }, { status: 400 });
    }
    
    // Update reminder rule
    const { data: rule, error } = await supabaseAdmin
      .from('reminder_rules')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update reminder rule'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rule,
      message: 'Reminder rule updated successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
