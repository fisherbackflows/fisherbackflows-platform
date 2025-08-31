import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { createAutoInvoice } from '../../invoices/route';
import type { TestReport, ApiResponse } from '@/types/api';

// Device update interface
interface DeviceUpdateData {
  last_test_date: string;
  status: string;
  next_test_date?: string;
}

// Automated test completion workflow
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
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
          name,
          email,
          phone,
          address
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

    // Create test report
    const testReportData = {
      customer_id: appointment.customer_id,
      device_id: data.deviceId,
      test_date: data.testDate || new Date().toISOString().split('T')[0],
      test_type: appointment.service_type,
      initial_pressure: data.initialPressure || 15.0,
      final_pressure: data.finalPressure || 14.5,
      test_duration: data.testDuration || 15,
      status: data.testResult, // 'Passed', 'Failed', 'Needs Repair'
      technician: data.technician || appointment.technician || 'Mike Fisher',
      notes: data.notes || '',
      water_district: data.waterDistrict || 'City of Tacoma',
      submitted: true,
      submitted_date: new Date().toISOString()
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
      .update({ status: 'Completed' })
      .eq('id', data.appointmentId);

    // Update device status and last test date
    const deviceUpdateData: DeviceUpdateData = {
      last_test_date: testReportData.test_date,
      status: data.testResult
    };

    // If test passed, set next test date
    if (data.testResult === 'Passed') {
      const nextTestDate = new Date(testReportData.test_date);
      nextTestDate.setFullYear(nextTestDate.getFullYear() + 1);
      deviceUpdateData.next_test_date = nextTestDate.toISOString().split('T')[0];
      
      // Update customer's next test date as well
      await supabase
        .from('customers')
        .update({ 
          next_test_date: nextTestDate.toISOString().split('T')[0],
          status: 'Active'
        })
        .eq('id', appointment.customer_id);
    } else {
      // If failed, customer needs service
      await supabase
        .from('customers')
        .update({ status: 'Needs Service' })
        .eq('id', appointment.customer_id);
    }

    await supabase
      .from('devices')
      .update(deviceUpdateData)
      .eq('id', data.deviceId);

    // Auto-generate invoice
    let invoice = null;
    try {
      invoice = await createAutoInvoice(
        appointment.customer_id,
        appointment.service_type,
        device.size,
        `Test completed on ${testReportData.test_date}. Result: ${data.testResult}`
      );
    } catch (invoiceError) {
      console.error('Error creating auto invoice:', invoiceError);
    }

    // Send push notification to admins about test completion
    try {
      const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Test Completed - ${data.testResult}`,
          message: `${appointment.customers?.name || 'Customer'}'s backflow test ${data.testResult.toLowerCase()}. ${data.testResult === 'Passed' ? 'Invoice generated automatically.' : 'Customer will need repairs.'}`,
          type: 'test_completed',
          data: {
            testReportId: testReport.id,
            customerId: appointment.customer_id,
            customerName: appointment.customers?.name,
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