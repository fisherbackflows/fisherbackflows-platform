import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { reportId } = await request.json()

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    // Fetch test report with all related data
    const { data: report, error } = await supabase
      .from('test_reports')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          zip_code
        ),
        devices (
          id,
          location,
          device_type,
          manufacturer,
          model,
          serial_number,
          installation_date
        )
      `)
      .eq('id', reportId)
      .single()

    if (error || !report) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Test report not found' }, { status: 404 })
    }

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
    
    // Certificate number and date
    doc.setFontSize(10)
    doc.text(`Certificate #: ${report.certificate_number || 'N/A'}`, 15, 40)
    doc.text(`Test Date: ${new Date(report.test_date).toLocaleDateString()}`, 150, 40)
    
    // Customer Information Section
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('CUSTOMER INFORMATION', 15, 55)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    
    const customer = report.customers
    doc.text(`Name: ${customer.first_name} ${customer.last_name}`, 15, 62)
    doc.text(`Email: ${customer.email}`, 15, 68)
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 15, 74)
    doc.text(`Address: ${customer.address_line1}`, 15, 80)
    if (customer.address_line2) {
      doc.text(`         ${customer.address_line2}`, 15, 86)
      doc.text(`         ${customer.city}, ${customer.state} ${customer.zip_code}`, 15, 92)
    } else {
      doc.text(`         ${customer.city}, ${customer.state} ${customer.zip_code}`, 15, 86)
    }
    
    // Device Information Section
    const deviceY = customer.address_line2 ? 105 : 99
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('DEVICE INFORMATION', 15, deviceY)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    
    const device = report.devices
    doc.text(`Location: ${device.location}`, 15, deviceY + 7)
    doc.text(`Device Type: ${device.device_type}`, 15, deviceY + 13)
    doc.text(`Manufacturer: ${device.manufacturer || 'N/A'}`, 15, deviceY + 19)
    doc.text(`Model: ${device.model || 'N/A'}`, 15, deviceY + 25)
    doc.text(`Serial Number: ${device.serial_number || 'N/A'}`, 15, deviceY + 31)
    doc.text(`Installation Date: ${device.installation_date ? new Date(device.installation_date).toLocaleDateString() : 'N/A'}`, 15, deviceY + 37)
    
    // Test Results Section
    const resultsY = deviceY + 50
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('TEST RESULTS', 15, resultsY)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    
    // Result status with color coding
    const resultText = report.result.toUpperCase()
    if (report.result === 'Passed') {
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
    
    // Test measurements table
    const tableY = resultsY + 20
    doc.autoTable({
      startY: tableY,
      head: [['Measurement', 'Value', 'Unit']],
      body: [
        ['Initial Pressure', report.pressure_1 || 'N/A', 'PSI'],
        ['Final Pressure', report.pressure_2 || 'N/A', 'PSI'],
        ['Pressure Differential', report.pressure_differential || 'N/A', 'PSI'],
        ['Test Duration', report.test_duration || 'N/A', 'minutes']
      ],
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      }
    })
    
    // Notes Section (if any)
    if (report.notes) {
      const notesY = (doc as any).lastAutoTable.finalY + 15
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
    doc.text('Powered by Backflow Buddy API', 105, doc.internal.pageSize.height - 10, { align: 'center' })
    
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