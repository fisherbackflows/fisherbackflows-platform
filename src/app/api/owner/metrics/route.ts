import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    // Safe fallback for CI/dev when Supabase is not configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        upcomingInspections: 0,
        openWorkOrders: 0,
        totalCustomers: 0,
        source: 'fallback'
      });
    }

    // Upcoming inspections = appointments in the future (scheduled/in_progress)
    const { count: upcomingCount, error: upErr } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_date', new Date().toISOString())
      .in('status', ['scheduled', 'in_progress', 'Scheduled', 'In Progress']);

    if (upErr) throw upErr;

    // Open work orders = not completed/cancelled
    const { count: workOrders, error: woErr } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['scheduled', 'in_progress', 'Scheduled', 'In Progress']);

    if (woErr) throw woErr;

    // Total customers
    const { count: customerCount, error: custErr } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (custErr) throw custErr;

    return NextResponse.json({
      upcomingInspections: upcomingCount ?? 0,
      openWorkOrders: workOrders ?? 0,
      totalCustomers: customerCount ?? 0,
      source: 'supabase'
    });
  } catch (error) {
    console.error('Owner metrics error:', error);
    return NextResponse.json({
      upcomingInspections: 0,
      openWorkOrders: 0,
      totalCustomers: 0,
      source: 'error'
    }, { status: 200 });
  }
}

