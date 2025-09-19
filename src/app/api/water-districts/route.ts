import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

// GET - List all water districts
export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient(request);
    
    const { data: districts, error } = await supabase
      .from('water_districts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching water districts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch water districts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      districts: districts || []
    });

  } catch (error) {
    console.error('Water districts API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// POST - Create new water district
export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      contact_email, 
      contact_phone, 
      address,
      submission_requirements,
      submission_format = 'pdf',
      submission_method = 'email'
    } = body;

    // Validate required fields
    if (!name || !contact_email) {
      return NextResponse.json(
        { error: 'District name and contact email are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);
    
    const districtData = {
      name: name.trim(),
      contact_email: contact_email.toLowerCase().trim(),
      contact_phone: contact_phone?.trim(),
      address: address?.trim(),
      submission_requirements: submission_requirements || 'Annual backflow test reports required',
      submission_format: submission_format,
      submission_method: submission_method,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: district, error: createError } = await supabase
      .from('water_districts')
      .insert(districtData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating water district:', createError);
      return NextResponse.json(
        { error: 'Failed to create water district: ' + createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Water district created successfully',
      district
    }, { status: 201 });

  } catch (error) {
    console.error('Water district creation error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}