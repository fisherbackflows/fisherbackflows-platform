import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    const supabase = createRouteHandlerClient();
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: leads || [],
      total: count,
      data_source: 'database'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const supabase = createRouteHandlerClient();
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([{
        first_name: body.first_name,
        last_name: body.last_name,
        company_name: body.company_name,
        email: body.email,
        phone: body.phone,
        address: body.address_line1,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        source: body.source || 'manual',
        status: body.status || 'new',
        estimated_value: body.estimated_value || 0,
        notes: body.notes,
        assigned_to: body.assigned_to || 'Unassigned'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}