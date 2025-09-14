import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Get all invitations for the current user's company
export async function GET(request: NextRequest) {
  try {
    // Get session token
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('team_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Database connection
    const dbClient = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Get session and user
    const { data: session } = await dbClient
      .from('team_sessions')
      .select(`
        team_user_id,
        team_users!inner(
          id,
          email,
          first_name,
          last_name,
          role,
          company_id,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const user = session.team_users;
    if (!user.is_active || !user.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only company admins can view invitations
    if (user.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all invitations for the company
    const { data: invitations, error: invitationsError } = await dbClient
      .from('user_invitations')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        invited_by,
        invitation_token,
        expires_at,
        accepted_at,
        created_at,
        updated_at
      `)
      .eq('company_id', user.company_id)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // Update expired invitations
    const now = new Date().toISOString();
    const expiredInvitations = invitations?.filter(inv =>
      inv.status === 'pending' && inv.expires_at < now
    ) || [];

    if (expiredInvitations.length > 0) {
      await dbClient
        .from('user_invitations')
        .update({ status: 'expired' })
        .in('id', expiredInvitations.map(inv => inv.id));

      // Refresh the data
      const { data: updatedInvitations } = await dbClient
        .from('user_invitations')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          status,
          invited_by,
          invitation_token,
          expires_at,
          accepted_at,
          created_at,
          updated_at
        `)
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        invitations: updatedInvitations || [],
        total: updatedInvitations?.length || 0
      });
    }

    return NextResponse.json({
      invitations: invitations || [],
      total: invitations?.length || 0
    });

  } catch (error) {
    console.error('Invitations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new invitation
export async function POST(request: NextRequest) {
  try {
    // Get session token
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('team_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, first_name, last_name, role } = body;

    // Validation
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    const validRoles = ['company_admin', 'manager', 'tester', 'scheduler', 'billing_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Database connection
    const dbClient = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Get session and user
    const { data: session } = await dbClient
      .from('team_sessions')
      .select(`
        team_user_id,
        team_users!inner(
          id,
          email,
          first_name,
          last_name,
          role,
          company_id,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const user = session.team_users;
    if (!user.is_active || !user.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only company admins can create invitations
    if (user.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get company info to check user limits
    const { data: company } = await dbClient
      .from('companies')
      .select('max_users')
      .eq('id', user.company_id)
      .single();

    // Count current active users
    const { count: currentUsers } = await dbClient
      .from('team_users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', user.company_id)
      .eq('is_active', true);

    if (company && currentUsers && currentUsers >= company.max_users) {
      return NextResponse.json(
        { error: 'User limit reached for your plan' },
        { status: 400 }
      );
    }

    // Check if email is already invited or is a user
    const { data: existingUser } = await dbClient
      .from('team_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const { data: existingInvitation } = await dbClient
      .from('user_invitations')
      .select('id, status')
      .eq('company_id', user.company_id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingInvitation && existingInvitation.status === 'pending') {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 409 }
      );
    }

    // Create invitation
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: invitation, error: invitationError } = await dbClient
      .from('user_invitations')
      .insert({
        company_id: user.company_id,
        email: email.toLowerCase(),
        first_name: first_name || null,
        last_name: last_name || null,
        role,
        invited_by: user.id,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // TODO: Send invitation email
    // await sendInvitationEmail(invitation);

    return NextResponse.json({
      invitation,
      message: 'Invitation sent successfully'
    });

  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}