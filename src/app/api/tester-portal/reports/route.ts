import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

async function checkPermissions(request: NextRequest) {
  const cookies = request.cookies;
  const teamSession = cookies.get('team_session')?.value;
  
  if (!teamSession) {
    return { hasAccess: false, isOwner: false, user: null };
  }
  
  try {
    const { data: session } = await supabaseAdmin
      .from('team_sessions')
      .select(`
        team_user_id,
        expires_at,
        team_users (
          id, email, role, is_active
        )
      `)
      .eq('session_token', teamSession)
      .gt('expires_at', new Date().toISOString())
      .single();
      
    if (!session?.team_users) {
      return { hasAccess: false, isOwner: false, user: null };
    }
    
    const user = session.team_users as any;
    const isOwner = user.email === 'blake@fisherbackflows.com' || user.role === 'admin';
    
    return { hasAccess: true, isOwner, user };
  } catch (error) {
    return { hasAccess: false, isOwner: false, user: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires compliance subscription' 
      }, { status: 403 });
    }
    
    // Get test reports from database
    const { data: reports, error } = await supabaseAdmin
      .from('test_reports')
      .select(`
        id,
        customer_id,
        device_id,
        test_date,
        tester_name,
        tester_license,
        device_type,
        device_location,
        test_results,
        status,
        compliance_status,
        next_test_date,
        notes,
        submitted_to_district,
        district_submission_date,
        customers (
          id,
          name,
          email,
          phone,
          address,
          city
        ),
        devices (
          id,
          serial_number,
          manufacturer,
          model,
          size
        )
      `)
      .order('test_date', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch test reports'
      }, { status: 500 });
    }

    // Transform data to match frontend interface
    const transformedReports = (reports || []).map(report => ({
      id: report.id,
      customerId: report.customer_id,
      customerName: report.customers?.name || 'Unknown Customer',
      customerAddress: report.customers?.address || '',
      deviceId: report.device_id,
      deviceSerial: report.devices?.serial_number || '',
      deviceType: report.device_type || '',
      deviceLocation: report.device_location || '',
      deviceManufacturer: report.devices?.manufacturer || '',
      deviceModel: report.devices?.model || '',
      deviceSize: report.devices?.size || '',
      testDate: report.test_date,
      testerName: report.tester_name || '',
      testerLicense: report.tester_license || '',
      testResults: report.test_results || {},
      status: report.status || 'draft',
      complianceStatus: report.compliance_status || 'pending',
      nextTestDate: report.next_test_date,
      notes: report.notes || '',
      submittedToDistrict: report.submitted_to_district || false,
      districtSubmissionDate: report.district_submission_date
    }));
    
    return NextResponse.json({
      success: true,
      reports: transformedReports
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires compliance subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      customer_id,
      device_id,
      test_date,
      tester_name,
      tester_license,
      device_type,
      device_location,
      test_results,
      compliance_status,
      next_test_date,
      notes
    } = body;
    
    // Create new test report
    const { data: report, error } = await supabaseAdmin
      .from('test_reports')
      .insert({
        customer_id,
        device_id,
        test_date,
        tester_name,
        tester_license,
        device_type,
        device_location,
        test_results: test_results || {},
        status: 'draft',
        compliance_status: compliance_status || 'pending',
        next_test_date,
        notes: notes || '',
        submitted_to_district: false,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create test report'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Test report created successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires compliance subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, submit_to_district, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Report ID required'
      }, { status: 400 });
    }
    
    // Update test report
    const updatePayload: any = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Handle district submission
    if (submit_to_district) {
      updatePayload.submitted_to_district = true;
      updatePayload.district_submission_date = new Date().toISOString();
      updatePayload.status = 'submitted';
    }
    
    const { data: report, error } = await supabaseAdmin
      .from('test_reports')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update test report'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Test report updated successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
