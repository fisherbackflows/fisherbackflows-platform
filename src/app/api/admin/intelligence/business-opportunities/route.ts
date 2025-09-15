import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictiveAnalyticsEngine } from '@/lib/ai/predictive-engine';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'upsell', 'retention', 'expansion', 'efficiency'
    const minValue = parseFloat(url.searchParams.get('minValue') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Verify admin access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teamUser } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!teamUser || (teamUser as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const engine = new PredictiveAnalyticsEngine();
    let opportunities = await engine.identifyBusinessOpportunities();

    // Apply filters
    if (type) {
      opportunities = opportunities.filter(opp => opp.type === type);
    }

    if (minValue > 0) {
      opportunities = opportunities.filter(opp => opp.potentialValue >= minValue);
    }

    // Sort by potential value (descending) and limit results
    opportunities = opportunities
      .sort((a, b) => b.potentialValue - a.potentialValue)
      .slice(0, limit);

    // Calculate summary statistics
    const summary = {
      totalOpportunities: opportunities.length,
      totalPotentialValue: opportunities.reduce((sum, opp) => sum + opp.potentialValue, 0),
      averagePotentialValue: opportunities.length > 0
        ? opportunities.reduce((sum, opp) => sum + opp.potentialValue, 0) / opportunities.length
        : 0,
      typeBreakdown: {
        upsell: opportunities.filter(opp => opp.type === 'upsell').length,
        retention: opportunities.filter(opp => opp.type === 'retention').length,
        expansion: opportunities.filter(opp => opp.type === 'expansion').length,
        efficiency: opportunities.filter(opp => opp.type === 'efficiency').length
      },
      timelineBreakdown: opportunities.reduce((acc: any, opp) => {
        acc[opp.timeline] = (acc[opp.timeline] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      opportunities,
      summary,
      filters: { type, minValue, limit }
    });
  } catch (error) {
    console.error('Business opportunities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { opportunityId, action, notes } = await request.json();

    // Verify admin access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teamUser } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!teamUser || (teamUser as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!opportunityId || !action) {
      return NextResponse.json({ 
        error: 'Opportunity ID and action required' 
      }, { status: 400 });
    }

    // Valid actions: 'accept', 'dismiss', 'investigate', 'implement'
    const validActions = ['accept', 'dismiss', 'investigate', 'implement'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be one of: ' + validActions.join(', ') 
      }, { status: 400 });
    }

    // Log the opportunity action
    await supabase.from('audit_logs').insert({
      table_name: 'business_opportunities',
      action: `OPPORTUNITY_${action.toUpperCase()}`,
      details: {
        opportunityId,
        action,
        notes,
        timestamp: new Date().toISOString(),
        actionBy: session.user.id
      },
      created_by: session.user.id
    } as any);

    // In a real implementation, you might update a business_opportunities table
    // For now, we'll return success confirmation
    return NextResponse.json({
      success: true,
      opportunityId,
      action,
      notes,
      timestamp: new Date().toISOString()
    } as any);
  } catch (error) {
    console.error('Business opportunity action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}