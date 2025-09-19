import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { auth } from '@/lib/auth'
const jsPDF = require('jspdf').default;
require('jspdf-autotable');

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 PDF generation request from user:', user.email, 'role:', user.role);

    const { reportId } = await request.json()

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    console.log('📄 Generating PDF for report:', reportId);

    const supabase = createRouteHandlerClient(request);

    // Fetch test report with all related data using correct relationship syntax
    const { data: report, error } = await supabase
      .from('test_reports')
      .select(`
        *,
        customer:customers (
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          zip_code
        ),
        device:devices (
          id,
          location_description,
          device_type,
          manufacturer,
          model,
          serial_number,
          size_inches,
          installation_date
        ),
        appointment:appointments (
          scheduled_date,
          appointment_type,
          status
        )
      `)
      .eq('id', reportId)
      .single()

    if (error || !report) {
      console.error('❌ Database error fetching report:', error)
      return NextResponse.json({ error: 'Test report not found' }, { status: 404 })
    }

    // For customer users, ensure they can only access their own reports
    if (user.role === 'customer') {
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerRecord && report.customer_id !== customerRecord.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    console.log('✅ Report data retrieved successfully');

    // Create PDF document
    const doc = new jsPDF()
    
    // Set up fonts and colors
    const primaryColor = '#0ea5e9'
    const textColor = '#1f2937'
    const lightGray = '#f3f4f6'
    
    // Add header with company name
    doc.setFillColor(14, 165, 233) // Sky blue
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text('BACKFLOW TEST REPORT', 105, 15, { align: 'center' })
    doc.setFontSize(10)
    doc.text('Certified Testing Results', 105, 22, { align: 'center' })
    
    // Reset text color
    doc.setTextColor(31, 41, 55)
    
    // Report ID and test date
    doc.setFontSize(10)
    doc.text(`Report ID: ${report.id}`, 15, 40)
    doc.text(`Test Date: ${new Date(report.test_date).toLocaleDateString()}`, 150, 40)
    doc.text(`Certifier: ${report.certifier_name}`, 15, 46)
    doc.text(`License #: ${report.certifier_number}`, 150, 46)

    // Customer Information Section
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('CUSTOMER INFORMATION', 15, 60)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)

    const customer = report.customer
    const customerName = customer.company_name || `${customer.first_name} ${customer.last_name}`
    doc.text(`Name: ${customerName}`, 15, 67)
    doc.text(`Email: ${customer.email}`, 15, 73)
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 15, 79)
    if (customer.address_line1) {
      doc.text(`Address: ${customer.address_line1}`, 15, 85)
      if (customer.address_line2) {
        doc.text(`         ${customer.address_line2}`, 15, 91)
        doc.text(`         ${customer.city}, ${customer.state} ${customer.zip_code}`, 15, 97)
      } else {
        doc.text(`         ${customer.city}, ${customer.state} ${customer.zip_code}`, 15, 91)
      }
    }
    
    // Device Information Section
    const deviceY = customer.address_line1 && customer.address_line2 ? 110 : customer.address_line1 ? 104 : 90
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('DEVICE INFORMATION', 15, deviceY)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)

    const device = report.device
    doc.text(`Location: ${device.location_description || 'N/A'}`, 15, deviceY + 7)
    doc.text(`Device Type: ${device.device_type || 'N/A'}`, 15, deviceY + 13)
    doc.text(`Manufacturer: ${device.manufacturer || 'N/A'}`, 15, deviceY + 19)
    doc.text(`Model: ${device.model || 'N/A'}`, 15, deviceY + 25)
    doc.text(`Size: ${device.size_inches || 'N/A'}`, 150, deviceY + 19)
    doc.text(`Serial Number: ${device.serial_number || 'N/A'}`, 15, deviceY + 31)
    if (device.installation_date) {
      doc.text(`Installation Date: ${new Date(device.installation_date).toLocaleDateString()}`, 15, deviceY + 37)
    }
    
    // Test Results Section
    const resultsY = deviceY + 50
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('TEST RESULTS', 15, resultsY)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    
    // Result status with color coding
    const resultText = report.test_passed ? 'PASSED' : 'FAILED'
    if (report.test_passed) {
      doc.setTextColor(34, 197, 94) // Green
    } else {
      doc.setTextColor(239, 68, 68) // Red
    }
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(`STATUS: ${resultText}`, 15, resultsY + 10)
    
    // Reset text style
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    
    // Test measurements - simple table format
    const tableY = resultsY + 20
    doc.text('Test Measurements:', 15, tableY)
    doc.text(`Initial Pressure: ${report.initial_pressure || 'N/A'} PSI`, 15, tableY + 8)
    doc.text(`Final Pressure: ${report.final_pressure || 'N/A'} PSI`, 15, tableY + 16)
    doc.text(`Pressure Drop: ${report.pressure_drop || 'N/A'} PSI`, 15, tableY + 24)
    doc.text(`Test Duration: ${report.test_duration || 'N/A'} minutes`, 15, tableY + 32)
    
    // Notes Section (if any)
    if (report.notes) {
      const notesY = tableY + 45
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('NOTES', 15, notesY)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)

      // Wrap long notes text
      const splitNotes = doc.splitTextToSize(report.notes, 180)
      doc.text(splitNotes, 15, notesY + 7)
    }
    
    // Technician signature section
    const signatureY = doc.internal.pageSize.height - 50
    doc.setFontSize(10)
    doc.text('Technician ID:', 15, signatureY)
    doc.text(report.technician_id || 'N/A', 50, signatureY)
    
    doc.line(15, signatureY + 10, 95, signatureY + 10)
    doc.text('Technician Signature', 15, signatureY + 15)
    
    doc.line(115, signatureY + 10, 195, signatureY + 10)
    doc.text('Date', 115, signatureY + 15)
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text('This report is certified accurate as of the test date shown above.', 105, doc.internal.pageSize.height - 20, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, doc.internal.pageSize.height - 15, { align: 'center' })
    doc.text('Powered by Tester Portal API', 105, doc.internal.pageSize.height - 10, { align: 'center' })
    
    // Generate PDF as buffer
    const pdfBuffer = doc.output('arraybuffer')
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="backflow-report-${reportId}.pdf"`
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}