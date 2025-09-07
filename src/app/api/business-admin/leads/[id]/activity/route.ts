import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { data: activities, error } = await supabase
      .from('lead_activity')
      .select('*')
      .eq('lead_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching lead activity:', error);
      // Return empty array if table doesn't exist yet
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          activities: []
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lead activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activities: activities || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: true, activities: [] },
      { status: 200 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient(request);
    const body = await request.json();
    
    const { data: activity, error } = await supabase
      .from('lead_activity')
      .insert([{
        lead_id: params.id,
        action: body.action,
        details: body.details,
        user: body.user || 'System',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead activity:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create activity log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activity
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}