import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictiveAnalyticsEngine } from '@/lib/ai/predictive-engine';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');

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

    if (customerId) {
      // Get specific customer health score
      const healthScore = await engine.calculateCustomerHealthScore(customerId);
      return NextResponse.json(healthScore);
    } else {
      // Get all customer health scores
      const { data: customers } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!customers) {
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
      }

      const healthScores = await Promise.all(
        customers.map(async (customer) => {
          const health = await engine.calculateCustomerHealthScore(customer.id);
          return {
            customerId: customer.id,
            customerName: `${customer.first_name} ${customer.last_name}`,
            customerEmail: customer.email,
            ...health
          };
        })
      );

      // Sort by health score descending
      healthScores.sort((a, b) => b.overallScore - a.overallScore);

      return NextResponse.json({ customers: healthScores });
    }
  } catch (error) {
    console.error('Customer health API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { customerId, updateFactors } = await request.json();

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

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const engine = new PredictiveAnalyticsEngine(supabase);
    
    // Recalculate health score (in a real implementation, updateFactors would be used to adjust weights)
    const updatedHealth = await engine.calculateCustomerHealthScore(customerId);

    // Log the health score update
    await supabase.from('audit_logs').insert({
      table_name: 'customers',
      action: 'HEALTH_SCORE_UPDATE',
      details: {
        customerId,
        newScore: updatedHealth.overallScore,
        factors: updatedHealth.factors,
        updatedBy: session.user.id
      },
      created_by: session.user.id
    });

    return NextResponse.json(updatedHealth);
  } catch (error) {
    console.error('Customer health update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}