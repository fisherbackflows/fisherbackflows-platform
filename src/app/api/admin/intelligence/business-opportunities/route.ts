import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictiveAnalyticsEngine } from '@/lib/ai/predictive-engine';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const priority = url.searchParams.get('priority'); // 'high', 'medium', 'low'
    const category = url.searchParams.get('category'); // 'customer_expansion', 'operational_efficiency', etc.
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

    if (!teamUser || teamUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const engine = new PredictiveAnalyticsEngine(supabase);
    let opportunities = await engine.identifyBusinessOpportunities();

    // Apply filters
    if (priority) {
      opportunities = opportunities.filter(opp => opp.priority === priority);
    }
    
    if (category) {
      opportunities = opportunities.filter(opp => opp.category === category);
    }

    // Sort by revenue potential (descending) and limit results
    opportunities = opportunities
      .sort((a, b) => b.revenueImpact - a.revenueImpact)
      .slice(0, limit);

    // Calculate summary statistics
    const summary = {
      totalOpportunities: opportunities.length,
      totalRevenueImpact: opportunities.reduce((sum, opp) => sum + opp.revenueImpact, 0),
      averageRevenueImpact: opportunities.length > 0 
        ? opportunities.reduce((sum, opp) => sum + opp.revenueImpact, 0) / opportunities.length 
        : 0,
      priorityBreakdown: {
        high: opportunities.filter(opp => opp.priority === 'high').length,
        medium: opportunities.filter(opp => opp.priority === 'medium').length,
        low: opportunities.filter(opp => opp.priority === 'low').length
      },
      categoryBreakdown: opportunities.reduce((acc, opp) => {
        acc[opp.category] = (acc[opp.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      opportunities,
      summary,
      filters: { priority, category, limit }
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

    if (!teamUser || teamUser.role !== 'admin') {
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
    });

    // In a real implementation, you might update a business_opportunities table
    // For now, we'll return success confirmation
    return NextResponse.json({
      success: true,
      opportunityId,
      action,
      notes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Business opportunity action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}