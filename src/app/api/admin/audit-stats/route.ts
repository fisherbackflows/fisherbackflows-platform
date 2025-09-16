import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { auditLogger } from '@/lib/audit-logger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';

    const supabase = createRouteHandlerClient({ cookies });

    // Verify admin authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', authUser.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get audit statistics
    const stats = await (auditLogger as any).getAuditStats(timeframe as 'day' | 'week' | 'month');

    return NextResponse.json({
      success: true,
      stats,
      timeframe
    });

  } catch (error) {
    console.error('Failed to get audit stats:', error);
    return NextResponse.json(
      { error: 'Failed to get audit stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}