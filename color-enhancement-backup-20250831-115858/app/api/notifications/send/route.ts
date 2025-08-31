import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userId, 
      title, 
      message, 
      type = 'general',
      data = {}
    } = body;

    const supabase = createRouteHandlerClient(request);

    // Log notification to database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createRouteHandlerClient(request);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}