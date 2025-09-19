import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';
import { sendEmail, emailTemplates } from '@/lib/email';

export interface TestReport {
  id: string
  appointment_id?: string
  customer_id: string
  device_id: string
  technician_id?: string
  test_date: string
  test_time?: string
  test_type: string
  test_passed: boolean
  initial_pressure: number
  final_pressure: number
  pressure_drop: number
  check_valve_1_passed: boolean
  check_valve_2_passed: boolean
  relief_valve_passed: boolean
  overall_condition: string
  repairs_needed: boolean
  repairs_completed: boolean
  certifier_name: string
  certifier_number: string
  photo_url?: string
  signature_url?: string
  submitted_to_district: boolean
  district_submission_date?: string
  district_confirmation_number?: string
  notes?: string
  created_at: string
  updated_at: string
  company_id?: string
}


export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Fetching test reports for user:', user.email, 'role:', user.role);

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const customer_id = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const test_passed = searchParams.get('test_passed');
    const submitted_to_district = searchParams.get('submitted_to_district');

    const targetCustomerId = customerId || customer_id;

    const supabase = createRouteHandlerClient(request);

    console.log('📍 Query filters:', { targetCustomerId, status, test_passed, submitted_to_district });

    // Build query with proper relationships
    let query = supabase
      .from('test_reports')
      .select(`
        *,
        customer:customers(first_name, last_name, company_name, email, phone, address_line1, city, state),
        device:devices(device_type, manufacturer, model, location_description, serial_number, size_inches),
        appointment:appointments(scheduled_date, appointment_type, status)
      `)
      .order('test_date', { ascending: false });

    // Apply filters
    if (targetCustomerId) {
      query = query.eq('customer_id', targetCustomerId);
    }

    if (status) {
      // Handle both old status field and new test_passed boolean
      if (status.toLowerCase() === 'passed') {
        query = query.eq('test_passed', true);
      } else if (status.toLowerCase() === 'failed') {
        query = query.eq('test_passed', false);
      }
    }

    if (test_passed !== null) {
      query = query.eq('test_passed', test_passed === 'true');
    }

    if (submitted_to_district !== null) {
      query = query.eq('submitted_to_district', submitted_to_district === 'true');
    }

    // For customer users, only show their own reports
    if (user.role === 'customer') {
      // Get customer record to find their customer_id
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerRecord) {
        query = query.eq('customer_id', customerRecord.id);
        console.log(`🔒 Customer-only filter applied for: ${customerRecord.id}`);
      }
    }

    const { data: testReports, error } = await query;

    if (error) {
      console.error('❌ Complex query failed:', error.message);

      // Fallback to simple query without relationships
      let simpleQuery = supabase
        .from('test_reports')
        .select('*')
        .order('test_date', { ascending: false });

      // Apply the same filters to simple query
      if (targetCustomerId) {
        simpleQuery = simpleQuery.eq('customer_id', targetCustomerId);
      }
      if (test_passed !== null) {
        simpleQuery = simpleQuery.eq('test_passed', test_passed === 'true');
      }
      if (submitted_to_district !== null) {
        simpleQuery = simpleQuery.eq('submitted_to_district', submitted_to_district === 'true');
      }

      const { data: simpleReports, error: simpleError } = await simpleQuery;

      if (simpleError) {
        console.error('❌ Simple query also failed:', simpleError.message);
        return NextResponse.json({
          error: 'Failed to fetch test reports',
          details: simpleError.message
        }, { status: 500 });
      }

      console.log(`✅ Simple query succeeded: ${simpleReports?.length || 0} reports`);
      return NextResponse.json({
        success: true,
        testReports: simpleReports || [],
        count: simpleReports?.length || 0,
        hasRealData: true,
        hasRelationships: false
      });
    }

    console.log(`✅ Complex query succeeded: ${testReports?.length || 0} reports`);

    return NextResponse.json({
      success: true,
      testReports: testReports || [],
      count: testReports?.length || 0,
      hasRealData: true,
      hasRelationships: true
    });

  } catch (error) {
    console.error('❌ Test reports API error:', error);
    return NextResponse.json({
      error: 'Server error fetching test reports'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const supabase = createRouteHandlerClient(request);
    
    // Validate required fields
    if (!data.customer_id || !data.device_id || !data.appointment_id) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, device_id, appointment_id' },
        { status: 400 }
      );
    }
    
    // Create test report data with correct column names and proper data types
    const testReportData = {
      appointment_id: data.appointment_id,
      customer_id: data.customer_id,
      device_id: data.device_id,
      technician_id: user.id,
      test_date: data.test_date || new Date().toISOString().split('T')[0],
      test_time: data.test_time || new Date().toTimeString().split(' ')[0],
      test_type: data.test_type || 'Annual Test',
      test_passed: Boolean(data.test_passed !== undefined ? data.test_passed : true),
      initial_pressure: Number(data.initial_pressure || 0),
      final_pressure: Number(data.final_pressure || 0),
      pressure_drop: Number(data.pressure_drop || Math.abs((Number(data.initial_pressure) || 0) - (Number(data.final_pressure) || 0))),
      check_valve_1_passed: Boolean(data.check_valve_1_passed !== undefined ? data.check_valve_1_passed : true),
      check_valve_2_passed: Boolean(data.check_valve_2_passed !== undefined ? data.check_valve_2_passed : true),
      relief_valve_passed: Boolean(data.relief_valve_passed !== undefined ? data.relief_valve_passed : true),
      overall_condition: data.overall_condition || (data.test_passed ? 'Good' : 'Poor'),
      repairs_needed: Boolean(data.repairs_needed !== undefined ? data.repairs_needed : !data.test_passed),
      repairs_completed: Boolean(data.repairs_completed || false),
      certifier_name: data.certifier_name || `${user.metadata?.firstName || ''} ${user.metadata?.lastName || ''}`.trim() || 'Certified Technician',
      certifier_number: data.certifier_number || 'WA-BF-001',
      photo_url: data.photo_url || null,
      signature_url: data.signature_url || null,
      notes: data.notes || '',
      submitted_to_district: Boolean(data.submitted_to_district || false),
      district_submission_date: data.submitted_to_district ? new Date().toISOString() : null,
      district_confirmation_number: data.district_confirmation_number || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creating test report with data:', testReportData);
    
    const { data: testReport, error } = await supabase
      .from('test_reports')
      .insert(testReportData)
      .select(`
        *,
        customer:customers(first_name, last_name, company_name, email, phone),
        device:devices(device_type, manufacturer, model, location_description, serial_number),
        appointment:appointments(scheduled_date, appointment_type, status)
      `)
      .single();
    
    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to create test report', details: error.message },
        { status: 500 }
      );
    }
    
    // Send completion email to customer if test report was created successfully
    try {
      // Get customer information
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('first_name, last_name, email')
        .eq('id', data.customer_id)
        .single();
      
      if (!customerError && customer && customer.email) {
        const customerName = `${customer.first_name} ${customer.last_name}`;
        const reportUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal/reports`;
        
        const emailTemplate = emailTemplates.testComplete(customerName, reportUrl);
        
        await sendEmail({
          to: customer.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });
        
        console.log('✅ Test completion email sent to:', customer.email);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send test completion email:', emailError);
      // Don't fail the test report creation if email fails
    }
    
    return NextResponse.json({ 
      testReport,
      message: 'Test report created successfully and customer notified'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating test report:', error);
    return NextResponse.json(
      { error: 'Failed to create test report' },
      { status: 500 }
    );
  }
}