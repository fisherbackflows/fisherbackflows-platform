import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const teamSession = cookies.get('team_session')?.value;
    
    let userInfo = null;
    let isOwner = false;
    let subscriptions: string[] = [];
    let role = 'trial';
    
    if (teamSession) {
      const { data: session } = await supabaseAdmin
        .from('team_sessions')
        .select(`
          team_user_id,
          expires_at,
          team_users (
            id, email, role, first_name, last_name, is_active
          )
        `)
        .eq('session_token', teamSession)
        .gt('expires_at', new Date().toISOString())
        .single();
        
      if (session?.team_users) {
        const user = session.team_users as any;
        userInfo = user;
        
        // Check if this is the owner (you) - UPDATE THIS EMAIL
        if (user.email === 'blake@fisherbackflows.com' || 
            user.email === 'your-actual-email@fisherbackflows.com' || 
            user.role === 'admin') {
          isOwner = true;
          role = 'owner';
          subscriptions = [
            'customer-management',
            'scheduling',
            'route-optimization', 
            'billing',
            'compliance',
            'analytics',
            'marketing',
            'communications',
            'branding',
            'data-management'
          ];
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        role,
        subscriptions,
        isOwner,
        userInfo: userInfo ? {
          id: userInfo.id,
          email: userInfo.email,
          name: `${userInfo.first_name} ${userInfo.last_name}`,
          role: userInfo.role
        } : null
      }
    });
    
  } catch (error) {
    console.error('Permissions check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check permissions',
      data: {
        role: 'trial',
        subscriptions: [],
        isOwner: false,
        userInfo: null
      }
    }, { status: 500 });
  }
}
