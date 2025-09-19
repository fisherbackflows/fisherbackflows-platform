import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs';
import { verifyWebhook } from '@/lib/queue/qstash'
import { supabaseAdmin } from '@/lib/supabase'
// LEGITIMATE SERVICE ROLE USAGE: This operation requires elevated privileges
// Reason: Background job processing
import { logger } from '@/lib/logger'
import { updateJob } from '@/lib/db/queries'

interface PDFJobPayload {
  type: 'generate_pdf'
  data: {
    type: 'inspection_report' | 'invoice' | 'work_order_summary'
    inspectionId?: string
    invoiceId?: string
    workOrderId?: string
    options?: {
      includePhotos?: boolean
      includeSignature?: boolean
      template?: string
    }
  }
  orgId: string
  userId?: string
  metadata?: Record<string, any>
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

  try {
    // Verify QStash webhook
    const signature = req.headers.get('upstash-signature')
    const body = await req.text()
    const url = req.url

    if (!await verifyWebhook(signature, body, url)) {
      logger.warn('Invalid QStash signature for PDF job', { requestId })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload: PDFJobPayload = JSON.parse(body)

    logger.info('PDF generation job started', {
      type: payload.data.type,
      inspectionId: payload.data.inspectionId,
      invoiceId: payload.data.invoiceId,
      workOrderId: payload.data.workOrderId,
      orgId: payload.orgId,
      requestId
    })

    // Generate PDF based on type
    let pdfBuffer: Buffer
    let filename: string
    let metadata: any

    switch (payload.data.type) {
      case 'inspection_report':
        if (!payload.data.inspectionId) {
          throw new Error('Inspection ID required for inspection report')
        }
        const inspectionResult = await generateInspectionReport(
          payload.data.inspectionId,
          payload.orgId,
          payload.data.options
        )
        pdfBuffer = inspectionResult.buffer
        filename = inspectionResult.filename
        metadata = inspectionResult.metadata
        break

      case 'invoice':
        if (!payload.data.invoiceId) {
          throw new Error('Invoice ID required for invoice PDF')
        }
        const invoiceResult = await generateInvoice(
          payload.data.invoiceId,
          payload.orgId,
          payload.data.options
        )
        pdfBuffer = invoiceResult.buffer
        filename = invoiceResult.filename
        metadata = invoiceResult.metadata
        break

      case 'work_order_summary':
        if (!payload.data.workOrderId) {
          throw new Error('Work Order ID required for summary')
        }
        const workOrderResult = await generateWorkOrderSummary(
          payload.data.workOrderId,
          payload.orgId,
          payload.data.options
        )
        pdfBuffer = workOrderResult.buffer
        filename = workOrderResult.filename
        metadata = workOrderResult.metadata
        break

      default:
        throw new Error(`Unknown PDF type: ${payload.data.type}`)
    }

    // Upload PDF to Supabase Storage
    const storageResult = await uploadPDFToStorage(
      pdfBuffer,
      filename,
      payload.orgId
    )

    // Create report record in database
    const supabase = createServiceClient()
    
    const reportData: any = {
      org_id: payload.orgId,
      url: storageResult.publicUrl,
      sha256: storageResult.sha256,
      size_bytes: pdfBuffer.length,
      metadata: {
        ...metadata,
        generated_at: new Date().toISOString(),
        type: payload.data.type,
        options: payload.data.options
      },
      created_by: payload.userId
    }

    // Link to specific entity
    if (payload.data.inspectionId) {
      reportData.inspection_id = payload.data.inspectionId
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single()

    if (reportError) throw reportError

    logger.info('PDF generated and stored successfully', {
      reportId: report.id,
      filename,
      size: pdfBuffer.length,
      url: storageResult.publicUrl,
      requestId
    })

    return NextResponse.json({
      success: true,
      reportId: report.id,
      url: storageResult.publicUrl,
      size: pdfBuffer.length,
      requestId
    })

  } catch (error) {
    logger.error('PDF generation failed', { error, requestId })
    
    return NextResponse.json(
      { 
        error: 'PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId 
      },
      { status: 500 }
    )
  }
}

async function generateInspectionReport(
  inspectionId: string,
  orgId: string,
  options?: any
): Promise<{ buffer: Buffer; filename: string; metadata: any }> {
  const supabase = createServiceClient()

  // Get inspection data with related information
  const { data: inspection, error } = await supabase
    .from('inspections')
    .select(`
      *,
      work_order:work_orders(
        *,
        customer:customers(*)
      ),
      inspector:profiles!inspector_id(*)
    `)
    .eq('org_id', orgId)
    .eq('id', inspectionId)
    .single()

  if (error) throw error

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []

  doc.on('data', chunk => chunks.push(chunk))

  // Add header
  doc.fontSize(20)
     .text('Backflow Prevention Device Test Report', { align: 'center' })
     .moveDown()

  // Add inspection details
  doc.fontSize(14)
     .text(`Report ID: ${inspection.id}`)
     .text(`Test Date: ${new Date(inspection.created_at).toLocaleDateString()}`)
     .text(`Inspector: ${inspection.inspector?.full_name || 'N/A'}`)
     .moveDown()

  // Add customer information
  if (inspection.work_order?.customer) {
    const customer = inspection.work_order.customer
    doc.text('Customer Information:', { underline: true })
       .fontSize(12)
       .text(`Name: ${customer.name}`)
       .text(`Email: ${customer.email || 'N/A'}`)
       .text(`Phone: ${customer.phone || 'N/A'}`)
       .moveDown()
  }

  // Add test results
  if (inspection.test_data) {
    doc.fontSize(14)
       .text('Test Results:', { underline: true })
       .fontSize(12)
    
    // Format test data based on structure
    const testData = inspection.test_data as Record<string, any>
    Object.entries(testData).forEach(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      doc.text(`${formattedKey}: ${value}`)
    })
    
    doc.moveDown()
  }

  // Add notes if present
  if (inspection.notes) {
    doc.fontSize(14)
       .text('Notes:', { underline: true })
       .fontSize(12)
       .text(inspection.notes)
       .moveDown()
  }

  // Add approval information
  if (inspection.status === 'approved' && inspection.approved_at) {
    doc.fontSize(14)
       .text('Approval Information:', { underline: true })
       .fontSize(12)
       .text(`Approved Date: ${new Date(inspection.approved_at).toLocaleDateString()}`)
       .text(`Status: APPROVED`)
  }

  // Add footer
  doc.fontSize(10)
     .text('This report was generated electronically and is valid without signature.', {
       align: 'center',
       y: doc.page.height - 100
     })

  doc.end()

  // Wait for PDF to be created
  const buffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  const filename = `inspection-report-${inspectionId}-${Date.now()}.pdf`
  const metadata = {
    inspection_id: inspectionId,
    customer_name: inspection.work_order?.customer?.name,
    inspector_name: inspection.inspector?.full_name,
    test_date: inspection.created_at,
    status: inspection.status
  }

  return { buffer, filename, metadata }
}

async function generateInvoice(
  invoiceId: string,
  orgId: string,
  options?: any
): Promise<{ buffer: Buffer; filename: string; metadata: any }> {
  const supabase = createServiceClient()

  // Get invoice data
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*),
      line_items:invoice_line_items(*)
    `)
    .eq('org_id', orgId)
    .eq('id', invoiceId)
    .single()

  if (error) throw error

  // Create invoice PDF
  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []

  doc.on('data', chunk => chunks.push(chunk))

  // Add header
  doc.fontSize(24)
     .text('INVOICE', { align: 'center' })
     .moveDown()

  // Add invoice details
  doc.fontSize(14)
     .text(`Invoice Number: ${invoice.invoice_number}`)
     .text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`)
     .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`)
     .moveDown()

  // Add customer information
  if (invoice.customer) {
    doc.text('Bill To:', { underline: true })
       .fontSize(12)
       .text(invoice.customer.name)
       .text(invoice.customer.email || '')
       .moveDown()
  }

  // Add line items
  if (invoice.line_items && invoice.line_items.length > 0) {
    doc.fontSize(14)
       .text('Items:', { underline: true })
       .fontSize(12)

    let y = doc.y + 10
    
    // Headers
    doc.text('Description', 50, y)
    doc.text('Qty', 300, y)
    doc.text('Price', 350, y)
    doc.text('Total', 450, y)
    
    y += 20
    doc.moveTo(50, y).lineTo(500, y).stroke()
    y += 10

    // Line items
    invoice.line_items.forEach((item: any) => {
      doc.text(item.description, 50, y)
      doc.text(item.quantity.toString(), 300, y)
      doc.text(`$${(item.unit_price_cents / 100).toFixed(2)}`, 350, y)
      doc.text(`$${(item.total_cents / 100).toFixed(2)}`, 450, y)
      y += 20
    })

    // Total
    y += 10
    doc.moveTo(350, y).lineTo(500, y).stroke()
    y += 10
    doc.fontSize(14)
       .text(`Total: $${(invoice.total_cents / 100).toFixed(2)}`, 350, y)
  }

  // Add status
  doc.moveDown(2)
     .fontSize(14)
     .text(`Status: ${invoice.status.toUpperCase()}`)

  doc.end()

  const buffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  const filename = `invoice-${invoice.invoice_number}.pdf`
  const metadata = {
    invoice_id: invoiceId,
    invoice_number: invoice.invoice_number,
    customer_name: invoice.customer?.name,
    amount: invoice.total_cents,
    status: invoice.status
  }

  return { buffer, filename, metadata }
}

async function generateWorkOrderSummary(
  workOrderId: string,
  orgId: string,
  options?: any
): Promise<{ buffer: Buffer; filename: string; metadata: any }> {
  const supabase = createServiceClient()

  // Get work order data with inspections
  const { data: workOrder, error } = await supabase
    .from('work_orders')
    .select(`
      *,
      customer:customers(*),
      inspections(*)
    `)
    .eq('org_id', orgId)
    .eq('id', workOrderId)
    .single()

  if (error) throw error

  // Create work order summary
  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []

  doc.on('data', chunk => chunks.push(chunk))

  doc.fontSize(20)
     .text('Work Order Summary', { align: 'center' })
     .moveDown()

  doc.fontSize(14)
     .text(`Work Order: ${workOrder.title}`)
     .text(`Status: ${workOrder.status.toUpperCase()}`)
     .text(`Created: ${new Date(workOrder.created_at).toLocaleDateString()}`)

  if (workOrder.scheduled_at) {
    doc.text(`Scheduled: ${new Date(workOrder.scheduled_at).toLocaleDateString()}`)
  }

  if (workOrder.customer) {
    doc.moveDown()
       .text(`Customer: ${workOrder.customer.name}`)
       .text(`Email: ${workOrder.customer.email || 'N/A'}`)
       .text(`Phone: ${workOrder.customer.phone || 'N/A'}`)
  }

  if (workOrder.description) {
    doc.moveDown()
       .text('Description:', { underline: true })
       .fontSize(12)
       .text(workOrder.description)
  }

  // Add inspection summary
  if (workOrder.inspections && workOrder.inspections.length > 0) {
    doc.moveDown()
       .fontSize(14)
       .text('Inspections:', { underline: true })
       .fontSize(12)

    workOrder.inspections.forEach((inspection: any, index: number) => {
      doc.text(`${index + 1}. Status: ${inspection.status} - Created: ${new Date(inspection.created_at).toLocaleDateString()}`)
    })
  }

  doc.end()

  const buffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  const filename = `work-order-${workOrderId}-summary.pdf`
  const metadata = {
    work_order_id: workOrderId,
    title: workOrder.title,
    customer_name: workOrder.customer?.name,
    status: workOrder.status
  }

  return { buffer, filename, metadata }
}

async function uploadPDFToStorage(
  buffer: Buffer,
  filename: string,
  orgId: string
): Promise<{ publicUrl: string; sha256: string }> {
  const supabase = createServiceClient()
  
  // Calculate SHA256 hash
  const crypto = require('crypto')
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
  
  // Upload to storage bucket with org-scoped path
  const storagePath = `${orgId}/reports/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`
  
  const { data, error } = await supabase.storage
    .from('reports')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      metadata: {
        orgId,
        sha256
      }
    })

  if (error) throw error

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('reports')
    .getPublicUrl(storagePath)

  return {
    publicUrl: publicUrlData.publicUrl,
    sha256
  }
}