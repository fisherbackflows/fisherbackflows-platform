import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Get invoice with customer information
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(first_name, last_name, address, phone, email, company_name)
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check authorization - customer can only view their own invoices
    if (user.role === 'customer' && invoice.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare data for PDF generation
    const customerName = invoice.customer.company_name || 
                        `${invoice.customer.first_name} ${invoice.customer.last_name}`;
    
    // Parse line items (assuming they're stored as JSON or in a separate table)
    let items = [];
    try {
      items = invoice.line_items ? 
        (typeof invoice.line_items === 'string' ? 
          JSON.parse(invoice.line_items) : invoice.line_items) :
        [
          {
            description: 'Backflow Prevention Device Test',
            quantity: 1,
            unitPrice: invoice.subtotal || 75,
            total: invoice.subtotal || 75
          }
        ];
    } catch (parseError) {
      console.warn('Failed to parse line items, using default:', parseError);
      items = [
        {
          description: 'Backflow Prevention Device Test',
          quantity: 1,
          unitPrice: invoice.subtotal || 75,
          total: invoice.subtotal || 75
        }
      ];
    }

    const pdfData = {
      invoiceNumber: invoice.invoice_number || invoice.id.slice(0, 8),
      issueDate: invoice.issue_date || invoice.created_at?.split('T')[0],
      dueDate: invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: customerName,
      customerAddress: invoice.customer.address || '',
      items: items,
      subtotal: invoice.subtotal || 0,
      taxAmount: invoice.tax_amount || 0,
      totalAmount: invoice.total_amount || invoice.subtotal || 0
    };

    // Generate PDF
    const pdfBuffer = generateInvoicePDF(pdfData);
    
    // Set response headers for PDF download
    const filename = `invoice-${invoice.invoice_number || id}.pdf`;
    
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
    console.error('Invoice PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}