import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export interface TestReport {
  id: string
  customerId: string
  customerName: string
  deviceId: string
  testDate: string
  testType: string
  results: {
    initialPressure: number
    finalPressure: number
    testDuration: number
    status: 'Passed' | 'Failed' | 'Needs Repair'
  }
  technician: string
  notes?: string
  waterDistrict?: string
  submitted: boolean
  submittedDate?: string
}

// Mock test reports data
const mockTestReports: TestReport[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Smith',
    deviceId: 'dev1',
    testDate: '2024-01-15',
    testType: 'Annual Test',
    results: {
      initialPressure: 15.2,
      finalPressure: 14.8,
      testDuration: 600,
      status: 'Passed'
    },
    technician: 'Mike Fisher',
    notes: 'Device functioning properly',
    waterDistrict: 'Metro Water District',
    submitted: true,
    submittedDate: '2024-01-15'
  }
]

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    
    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Try to get real test reports from database
    let query = supabase
      .from('test_reports')
      .select(`
        *,
        customer:customers(first_name, last_name, company_name, email, phone),
        device:devices(device_type, manufacturer, model, location_description)
      `)
      .order('test_date', { ascending: false });
    
    // Apply filters
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: testReports, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      
      // Fallback to simple query
      const { data: simpleReports, error: simpleError } = await supabase
        .from('test_reports')
        .select('*')
        .order('test_date', { ascending: false });
        
      if (simpleError || !simpleReports || simpleReports.length === 0) {
        console.log('No test reports found in database, using mock data');
        
        // Return mock data if no real data exists
        let filteredReports = mockTestReports;
        
        if (customerId) {
          filteredReports = filteredReports.filter(report =>
            report.customerId === customerId
          );
        }
        if (status) {
          filteredReports = filteredReports.filter(report =>
            report.results.status === status
          );
        }
        
        return NextResponse.json({ 
          testReports: filteredReports,
          count: filteredReports.length,
          hasRealData: false,
          note: 'Using mock test report data - database needs real test reports'
        });
      }
      
      return NextResponse.json({ 
        testReports: simpleReports,
        count: simpleReports.length,
        hasRealData: true
      });
    }
    
    return NextResponse.json({ 
      testReports: testReports || [],
      count: testReports?.length || 0,
      hasRealData: true
    });
  } catch (error) {
    console.error('Error fetching test reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Validate required fields
    if (!data.customer_id || !data.device_id || !data.appointment_id) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, device_id, appointment_id' },
        { status: 400 }
      );
    }
    
    // Create test report data with correct column names
    const testReportData = {
      appointment_id: data.appointment_id,
      customer_id: data.customer_id,
      device_id: data.device_id,
      technician_id: user.id,
      test_date: data.test_date || new Date().toISOString().split('T')[0],
      test_time: data.test_time || '10:00:00',
      test_type: data.test_type || 'annual',
      test_passed: data.test_passed !== undefined ? data.test_passed : true,
      initial_pressure: data.initial_pressure || 0,
      final_pressure: data.final_pressure || 0,
      pressure_drop: data.pressure_drop || Math.abs((data.initial_pressure || 0) - (data.final_pressure || 0)),
      check_valve_1_passed: data.check_valve_1_passed !== undefined ? data.check_valve_1_passed : true,
      check_valve_2_passed: data.check_valve_2_passed !== undefined ? data.check_valve_2_passed : true,
      relief_valve_passed: data.relief_valve_passed !== undefined ? data.relief_valve_passed : true,
      overall_condition: data.overall_condition || (data.test_passed ? 'Good' : 'Poor'),
      repairs_needed: data.repairs_needed !== undefined ? data.repairs_needed : !data.test_passed,
      repairs_completed: data.repairs_completed || false,
      certifier_name: data.certifier_name || user.first_name + ' ' + user.last_name,
      certifier_number: data.certifier_number || 'WA-BF-001',
      notes: data.notes || '',
      submitted_to_district: data.submitted_to_district || false,
      district_submission_date: data.submitted_to_district ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    };
    
    console.log('Creating test report with data:', testReportData);
    
    const { data: testReport, error } = await supabase
      .from('test_reports')
      .insert(testReportData)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to create test report', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ testReport }, { status: 201 });
  } catch (error) {
    console.error('Error creating test report:', error);
    return NextResponse.json(
      { error: 'Failed to create test report' },
      { status: 500 }
    );
  }
}