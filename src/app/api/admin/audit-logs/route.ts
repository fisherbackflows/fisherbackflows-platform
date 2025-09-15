import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { auditLogger } from '@/lib/audit-logger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const severity = searchParams.get('severity') || '';
    const eventType = searchParams.get('eventType') || '';
    const user = searchParams.get('user') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const success = searchParams.get('success') || '';
    const regulation = searchParams.get('regulation') || '';

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
      .from('team_members')
      .select('role')
      .eq('user_id', authUser.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Build search criteria
    const criteria: any = {
      limit,
      offset: (page - 1) * limit
    };

    if (user) {
      criteria.userId = user;
    }

    if (eventType) {
      criteria.eventTypes = [eventType];
    }

    if (startDate) {
      criteria.startDate = new Date(startDate);
    }

    if (endDate) {
      criteria.endDate = new Date(endDate);
    }

    if (severity) {
      criteria.severity = severity;
    }

    if (success !== '') {
      criteria.success = success === 'true';
    }

    // Search audit logs using the audit logger
    const events = await auditLogger.searchLogs(criteria);

    // Apply additional filters that aren't built into searchLogs
    let filteredEvents = events;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredEvents = events.filter(event =>
        event.eventType.toLowerCase().includes(searchLower) ||
        event.userId?.toLowerCase().includes(searchLower) ||
        event.entityType?.toLowerCase().includes(searchLower) ||
        event.metadata && JSON.stringify(event.metadata).toLowerCase().includes(searchLower)
      );
    }

    if (regulation) {
      filteredEvents = filteredEvents.filter(event =>
        event.regulations?.includes(regulation as any)
      );
    }

    // Get total count for pagination
    const totalCount = filteredEvents.length;

    // Format events for frontend
    const formattedEvents = filteredEvents.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      event_type: event.eventType,
      user_id: event.userId,
      user_email: event.metadata?.userEmail || event.userId,
      entity_type: event.entityType,
      entity_id: event.entityId,
      severity: event.severity,
      success: event.success,
      ip_address: event.ipAddress,
      metadata: event.metadata || {},
      regulations: event.regulations || [],
      error_message: event.errorMessage
    }));

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}