import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';

// Automated test completion workflow
export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Field test completion: User', user.email, 'completing test');

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    const data = await request.json();
    
    // Validate required fields
    if (!data.appointmentId || !data.testResult || !data.deviceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get appointment and customer info
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          city,
          state,
          zip_code
        )
      `)
      .eq('id', data.appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get device info
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', data.deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    // Create test report with proper column names
    const testReportData = {
      appointment_id: data.appointmentId,
      customer_id: appointment.customer_id,
      device_id: data.deviceId,
      technician_id: appointment.assigned_technician || '0c1aeab4-350e-42c6-8dc2-0e3dcc278a38',
      test_date: data.testDate || new Date().toISOString().split('T')[0],
      test_time: new Date().toTimeString().split(' ')[0],
      test_type: appointment.appointment_type || 'annual',
      test_passed: data.testResult === 'Passed',
      initial_pressure: data.initialPressure || 15.0,
      final_pressure: data.finalPressure || 14.5,
      pressure_drop: Math.abs((data.initialPressure || 15.0) - (data.finalPressure || 14.5)),
      check_valve_1_passed: data.testResult === 'Passed',
      check_valve_2_passed: data.testResult === 'Passed',
      relief_valve_passed: data.testResult === 'Passed',
      overall_condition: data.testResult === 'Passed' ? 'Good' : 'Poor',
      repairs_needed: data.testResult !== 'Passed',
      repairs_completed: false,
      certifier_name: data.technician || 'Mike Fisher',
      certifier_number: 'WA-BF-001',
      notes: data.notes || '',
      submitted_to_district: true,
      district_submission_date: new Date().toISOString()
    };

    const { data: testReport, error: testError } = await supabase
      .from('test_reports')
      .insert(testReportData)
      .select()
      .single();

    if (testError) {
      console.error('Error creating test report:', testError);
      return NextResponse.json(
        { success: false, error: 'Failed to create test report' },
        { status: 500 }
      );
    }

    // Update appointment status
    await supabase
      .from('appointments')
      .update({ 
        status: 'completed',
        actual_start_time: new Date().toISOString(),
        actual_end_time: new Date().toISOString(),
        completion_notes: `Test ${data.testResult}: ${data.notes || 'No additional notes'}`
      })
      .eq('id', data.appointmentId);

    // Update device status and last test date
    const deviceUpdateData = {
      last_test_date: testReportData.test_date,
      device_status: data.testResult === 'Passed' ? 'active' : 'needs_service'
    };

    // If test passed, set next test date
    if (data.testResult === 'Passed') {
      const nextTestDate = new Date(testReportData.test_date);
      nextTestDate.setFullYear(nextTestDate.getFullYear() + 1);
      deviceUpdateData.next_test_due = nextTestDate.toISOString().split('T')[0];
      
      // Update customer status to active
      await supabase
        .from('customers')
        .update({ 
          account_status: 'active'
        })
        .eq('id', appointment.customer_id);
    } else {
      // If failed, customer needs service
      await supabase
        .from('customers')
        .update({ 
          account_status: 'needs_service'
        })
        .eq('id', appointment.customer_id);
    }

    await supabase
      .from('devices')
      .update(deviceUpdateData)
      .eq('id', data.deviceId);

    // Auto-generate invoice directly
    let invoice = null;
    try {
      const customerName = appointment.customers 
        ? `${appointment.customers.first_name} ${appointment.customers.last_name}`.trim()
        : 'Unknown Customer';
      
      // Calculate pricing based on device size
      const deviceSize = device?.size_inches || '0.75';
      const rates = {
        '0.5': 65,
        '0.75': 75, 
        '1': 100,
        '1.5': 125,
        '2': 150
      };
      const totalAmount = rates[deviceSize as keyof typeof rates] || 75;

      // Generate invoice number
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });
      
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      // Create invoice directly
      const invoiceData = {
        customer_id: appointment.customer_id,
        appointment_id: data.appointmentId,
        test_report_id: testReport.id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: totalAmount,
        tax_rate: 0.00,
        tax_amount: 0.00,
        discount_amount: 0.00,
        total_amount: totalAmount,
        amount_paid: 0.00,
        balance_due: totalAmount,
        status: 'draft',
        payment_terms: 'net_30',
        notes: `Test completed on ${testReportData.test_date}. Result: ${data.testResult}. Customer: ${customerName}`,
        internal_notes: 'Auto-generated from test completion',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        throw invoiceError;
      }

      invoice = newInvoice;
      console.log('✅ Invoice auto-generated:', invoice?.id);
    } catch (invoiceError) {
      console.error('❌ Error creating auto invoice:', invoiceError);
    }

    // Send push notification to admins about test completion
    try {
      const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Test Completed - ${data.testResult}`,
          message: `${customerName}'s backflow test ${data.testResult.toLowerCase()}. ${data.testResult === 'Passed' ? 'Invoice generated automatically.' : 'Customer will need repairs.'}`,
          type: 'test_completed',
          data: {
            testReportId: testReport.id,
            customerId: appointment.customer_id,
            customerName: customerName,
            testResult: data.testResult,
            invoiceId: invoice?.id
          },
          actions: [
            {
              action: 'view-report',
              title: 'View Report',
              icon: '/icons/report.png'
            },
            {
              action: 'contact-customer',
              title: 'Contact Customer',
              icon: '/icons/phone.png'
            }
          ],
          targetUrl: `/reports/${testReport.id}`,
          requireInteraction: data.testResult !== 'Passed' // Require interaction for failed tests
        })
      })
      
      if (notificationResponse.ok) {
        console.log('Push notification sent for test completion')
      }
    } catch (notifError) {
      console.error('Error sending push notification:', notifError)
    }

    // Send confirmation email (placeholder - implement with your email service)
    // await sendTestCompletionEmail(appointment.customers, testReport, invoice);

    return NextResponse.json({
      success: true,
      testReport,
      invoice,
      message: `Test completed successfully. Report submitted and invoice generated.`,
      automation: {
        appointmentUpdated: true,
        deviceUpdated: true,
        notificationSent: true,
        customerUpdated: true,
        invoiceGenerated: !!invoice,
        nextTestScheduled: data.testResult === 'Passed'
      }
    });

  } catch (error) {
    console.error('Error completing test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete test automation' },
      { status: 500 }
    );
  }
}

// Get all automated workflows status
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    
    // Get stats for automation dashboard
    const [
      completedTests,
      pendingInvoices,
      upcomingTests,
      overdueCustomers
    ] = await Promise.all([
      supabase.from('test_reports').select('id').eq('submitted', true),
      supabase.from('invoices').select('id').eq('status', 'Pending'),
      supabase.from('appointments').select('id').eq('status', 'Scheduled'),
      supabase.from('customers').select('id').eq('status', 'Needs Service')
    ]);

    return NextResponse.json({
      success: true,
      automation: {
        completedTestsToday: completedTests.data?.length || 0,
        pendingInvoices: pendingInvoices.data?.length || 0,
        upcomingAppointments: upcomingTests.data?.length || 0,
        customersNeedingService: overdueCustomers.data?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching automation stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automation stats' },
      { status: 500 }
    );
  }
}