import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';
import { generateTestReport } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient(request);
    
    // Get test report with customer and device information
    const { data: testReport, error } = await supabase
      .from('test_reports')
      .select(`
        *,
        customer:customers(first_name, last_name, address, phone, email),
        device:devices(serial_number, device_type, size, location),
        appointment:appointments(appointment_type)
      `)
      .eq('id', id)
      .single();

    if (error || !testReport) {
      return NextResponse.json(
        { error: 'Test report not found' },
        { status: 404 }
      );
    }

    // Check authorization - customer can only view their own reports
    if (user.role === 'customer' && testReport.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare data for PDF generation
    const pdfData = {
      customer: {
        name: `${testReport.customer.first_name} ${testReport.customer.last_name}`,
        address: testReport.customer.address || 'Address not provided',
        phone: testReport.customer.phone || 'Phone not provided',
        email: testReport.customer.email || 'Email not provided'
      },
      device: {
        serialNumber: testReport.device?.serial_number || 'N/A',
        type: testReport.device?.device_type || 'Unknown',
        size: testReport.device?.size || 'N/A',
        location: testReport.device?.location || 'Unknown location'
      },
      test: {
        date: testReport.test_date,
        technician: testReport.certifier_name || 'Unknown Technician',
        initialPressure: testReport.initial_pressure || 0,
        finalPressure: testReport.final_pressure || 0,
        duration: 10, // Default test duration in minutes
        result: testReport.test_passed ? 'pass' as const : 'fail' as const,
        notes: testReport.notes || undefined
      },
      certificateNumber: `FB-${testReport.id.slice(0, 8).toUpperCase()}`
    };

    // Generate PDF
    const pdfBuffer = generateTestReport(pdfData);
    
    // Set response headers for PDF download
    const filename = `test-report-${testReport.id}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}