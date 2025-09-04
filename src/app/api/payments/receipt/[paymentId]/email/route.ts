import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Get payment details with customer info
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        customer:customers(
          first_name,
          last_name,
          email,
          company_name
        ),
        invoice:invoices(
          invoice_number,
          description,
          total_amount
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

    const customer = payment.customer;
    if (!customer?.email) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Generate receipt email
    const customerName = `${customer.first_name} ${customer.last_name}`;
    const receiptNumber = `RCP-${payment.id.slice(-8).toUpperCase()}`;
    const paymentDate = new Date(payment.processed_at || payment.created_at).toLocaleDateString();

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin: 0;
        }
        .tagline {
            color: #666;
            margin: 5px 0 0 0;
        }
        .receipt-title {
            background: #2563eb;
            color: white;
            text-align: center;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
        }
        .details-section {
            background: #f8fafc;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .details-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #374151;
        }
        .value {
            color: #111827;
        }
        .amount-highlight {
            background: #10b981;
            color: white;
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 24px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px;
            font-weight: bold;
        }
        .contact-info {
            margin-top: 30px;
            padding: 15px;
            background: #eff6ff;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="company-name">Fisher Backflows</h1>
        <p class="tagline">Professional Backflow Testing Services</p>
    </div>

    <div class="receipt-title">
        PAYMENT RECEIPT
    </div>

    <p>Dear ${customerName},</p>
    
    <p>Thank you for your payment! This email serves as your official receipt for the payment processed on ${paymentDate}.</p>

    <div class="details-section">
        <h3 style="margin-top: 0; color: #2563eb;">Payment Details</h3>
        <div class="details-row">
            <span class="label">Receipt Number:</span>
            <span class="value">${receiptNumber}</span>
        </div>
        <div class="details-row">
            <span class="label">Payment Date:</span>
            <span class="value">${paymentDate}</span>
        </div>
        <div class="details-row">
            <span class="label">Transaction ID:</span>
            <span class="value">${payment.transaction_id || payment.id}</span>
        </div>
        <div class="details-row">
            <span class="label">Payment Method:</span>
            <span class="value">${payment.payment_method === 'card' ? 'Credit/Debit Card' : 'Bank Transfer'}</span>
        </div>
        <div class="details-row">
            <span class="label">Status:</span>
            <span class="value" style="color: #10b981; font-weight: bold;">PAID</span>
        </div>
    </div>

    ${payment.invoice ? `
    <div class="details-section">
        <h3 style="margin-top: 0; color: #2563eb;">Invoice Information</h3>
        <div class="details-row">
            <span class="label">Invoice Number:</span>
            <span class="value">${payment.invoice.invoice_number}</span>
        </div>
        <div class="details-row">
            <span class="label">Description:</span>
            <span class="value">${payment.invoice.description || 'Professional Services'}</span>
        </div>
    </div>
    ` : ''}

    <div class="amount-highlight">
        TOTAL PAID: $${payment.amount.toFixed(2)}
    </div>

    <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/payments/receipt/${payment.id}" class="button">
            Download PDF Receipt
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard" class="button">
            View Account
        </a>
    </p>

    <div class="contact-info">
        <h4 style="margin-top: 0; color: #2563eb;">Need Help?</h4>
        <p style="margin: 0;">
            <strong>Phone:</strong> (253) 555-0100<br>
            <strong>Email:</strong> billing@fisherbackflows.com<br>
            <strong>Hours:</strong> Monday - Friday, 9 AM - 5 PM PST
        </p>
    </div>

    <div class="footer">
        <p><strong>Fisher Backflows</strong><br>
        Professional Backflow Testing Services<br>
        This receipt confirms your payment has been successfully processed.</p>
        
        <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply directly to this message.<br>
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </p>
    </div>
</body>
</html>
    `;

    // Send email
    await sendEmail({
      to: customer.email,
      subject: `Payment Receipt - ${receiptNumber} - Fisher Backflows`,
      html: emailHtml,
      text: `
Payment Receipt - ${receiptNumber}

Dear ${customerName},

Thank you for your payment! Your payment of $${payment.amount.toFixed(2)} has been successfully processed.

Payment Details:
- Receipt Number: ${receiptNumber}
- Payment Date: ${paymentDate}
- Transaction ID: ${payment.transaction_id || payment.id}
- Amount: $${payment.amount.toFixed(2)}
- Status: PAID

${payment.invoice ? `
Invoice Information:
- Invoice Number: ${payment.invoice.invoice_number}
- Description: ${payment.invoice.description || 'Professional Services'}
` : ''}

Download your PDF receipt: ${process.env.NEXT_PUBLIC_APP_URL}/api/payments/receipt/${payment.id}

Questions? Contact us:
Phone: (253) 555-0100
Email: billing@fisherbackflows.com

Thank you for choosing Fisher Backflows!
      `.trim()
    });

    return NextResponse.json({
      success: true,
      message: 'Receipt sent successfully'
    });

  } catch (error) {
    const { paymentId } = await params;
    logger.error('Email receipt error', { error, paymentId });
    return NextResponse.json(
      { error: 'Failed to send receipt email' },
      { status: 500 }
    );
  }
}