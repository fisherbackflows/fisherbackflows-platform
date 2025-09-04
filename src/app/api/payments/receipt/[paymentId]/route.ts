import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import jsPDF from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Get payment details with customer and invoice info
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          company_name,
          address
        ),
        invoice:invoices(
          id,
          invoice_number,
          description,
          total_amount,
          due_date,
          issued_date
        )
      `)
      .eq('id', paymentId)
      .eq('status', 'completed')
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Payment not found or not completed' },
        { status: 404 }
      );
    }

    // Generate PDF receipt
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT RECEIPT', pageWidth / 2, 30, { align: 'center' });

    // Company info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Fisher Backflows', pageWidth / 2, 45, { align: 'center' });
    pdf.text('Professional Backflow Testing Services', pageWidth / 2, 55, { align: 'center' });
    pdf.text('Phone: (253) 555-0100 | Email: info@fisherbackflows.com', pageWidth / 2, 65, { align: 'center' });

    // Divider line
    pdf.line(20, 75, pageWidth - 20, 75);

    // Receipt details
    const startY = 90;
    let currentY = startY;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Receipt Details', 20, currentY);
    currentY += 15;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const details = [
      ['Receipt Number:', `RCP-${payment.id.slice(-8).toUpperCase()}`],
      ['Payment Date:', new Date(payment.processed_at || payment.created_at).toLocaleDateString()],
      ['Transaction ID:', payment.transaction_id || payment.stripe_payment_intent_id || payment.id],
      ['Payment Method:', payment.payment_method === 'card' ? 'Credit/Debit Card' : 'Bank Transfer (ACH)'],
      ['Amount Paid:', `$${payment.amount.toFixed(2)}`],
      ['Status:', 'PAID']
    ];

    details.forEach(([label, value]) => {
      pdf.text(label, 20, currentY);
      pdf.text(value, 120, currentY);
      currentY += 12;
    });

    currentY += 10;

    // Customer information
    if (payment.customer) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Customer Information', 20, currentY);
      currentY += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      const customerName = `${payment.customer.first_name} ${payment.customer.last_name}`;
      const customerDetails = [
        ['Name:', customerName],
        ['Email:', payment.customer.email],
        ['Phone:', payment.customer.phone || 'N/A'],
        ['Company:', payment.customer.company_name || 'N/A']
      ];

      customerDetails.forEach(([label, value]) => {
        pdf.text(label, 20, currentY);
        pdf.text(value, 120, currentY);
        currentY += 12;
      });

      currentY += 10;
    }

    // Invoice information
    if (payment.invoice) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Invoice Information', 20, currentY);
      currentY += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      const invoiceDetails = [
        ['Invoice Number:', payment.invoice.invoice_number],
        ['Invoice Date:', new Date(payment.invoice.issued_date).toLocaleDateString()],
        ['Due Date:', new Date(payment.invoice.due_date).toLocaleDateString()],
        ['Description:', payment.invoice.description || 'Professional Services'],
        ['Invoice Amount:', `$${payment.invoice.total_amount.toFixed(2)}`]
      ];

      invoiceDetails.forEach(([label, value]) => {
        pdf.text(label, 20, currentY);
        pdf.text(value, 120, currentY);
        currentY += 12;
      });
    }

    // Payment summary box
    currentY += 20;
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(20, currentY - 5, pageWidth - 40, 30);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('TOTAL PAID', pageWidth / 2, currentY + 8, { align: 'center' });
    pdf.text(`$${payment.amount.toFixed(2)}`, pageWidth / 2, currentY + 20, { align: 'center' });

    // Footer
    const footerY = pageHeight - 40;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
    pdf.text('This receipt confirms payment has been successfully processed.', pageWidth / 2, footerY + 10, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, footerY + 20, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${payment.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    logger.error('Receipt generation error', { error });
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}