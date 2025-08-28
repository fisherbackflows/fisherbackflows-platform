/**
 * Invoice & Payment Processing - REAL WORKING IMPLEMENTATION
 * Connects Stripe payments to actual invoice workflows with automatic reconciliation
 */

import { createClient } from '@/lib/supabase/client';
import stripeService, { StripePaymentProcessor, StripeCustomerManager } from '@/lib/payment/stripe';
import { auditLogger, AuditEventType } from '@/lib/compliance/audit-logger';
import { monitoring } from '@/lib/monitoring/monitoring';
import { logger } from '@/lib/logger';
import { getEmailService } from '@/lib/email/email-service';
import { cache } from '@/lib/cache/redis';
import { validateAndSanitize, InvoiceSchema, PaymentSchema } from '@/lib/validation/schemas';

export interface Invoice {
  id: string;
  customerId: string;
  appointmentId?: string;
  testReportId?: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  lineItems: LineItem[];
  paymentTerms: number;
  notes?: string;
  internalNotes?: string;
  sentDate?: string;
  viewedDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  stripeInvoiceId?: string;
  stripePaymentIntent?: string;
  pdfUrl?: string;
  reminderCount: number;
  lastReminderDate?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
}

export interface Payment {
  id: string;
  customerId: string;
  invoiceId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  processingFee: number;
  netAmount: number;
  referenceNumber?: string;
  stripePaymentId?: string;
  stripeChargeId?: string;
  cardLast4?: string;
  cardBrand?: string;
  notes?: string;
  metadata: Record<string, any>;
  refundAmount: number;
  refundDate?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export class InvoicePaymentService {
  private supabase = createClient();
  private emailService = getEmailService();

  /**
   * Create invoice with automatic numbering and tax calculation
   */
  async createInvoice(
    invoiceData: {
      customerId: string;
      appointmentId?: string;
      testReportId?: string;
      lineItems: LineItem[];
      dueDate?: string;
      notes?: string;
      paymentTerms?: number;
    },
    createdByUserId?: string
  ): Promise<{ invoice: Invoice | null; error: string | null }> {
    const transaction = monitoring.startTransaction('invoice.create');
    
    try {
      // Validate customer exists
      const { data: customer, error: customerError } = await this.supabase
        .from('customers')
        .select('id, contact_name, email, tax_exempt, service_address, organization_id')
        .eq('id', invoiceData.customerId)
        .eq('is_active', true)
        .single();

      if (customerError || !customer) {
        return { invoice: null, error: 'Customer not found' };
      }

      // Calculate totals
      const subtotal = invoiceData.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxRate = customer.tax_exempt ? 0 : 0.1025; // WA State tax
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate due date
      const dueDate = invoiceData.dueDate || this.calculateDueDate(invoiceData.paymentTerms || 30);

      // Create invoice
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .insert({
          customer_id: invoiceData.customerId,
          appointment_id: invoiceData.appointmentId,
          test_report_id: invoiceData.testReportId,
          invoice_number: invoiceNumber,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate,
          line_items: invoiceData.lineItems,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          paid_amount: 0,
          balance_due: totalAmount,
          payment_terms: invoiceData.paymentTerms || 30,
          notes: invoiceData.notes,
          reminder_count: 0,
          organization_id: customer.organization_id
        })
        .select()
        .single();

      if (invoiceError || !invoice) {
        logger.error('Failed to create invoice', { error: invoiceError, invoiceData });
        return { invoice: null, error: 'Failed to create invoice' };
      }

      // Generate and store PDF
      const pdfUrl = await this.generateInvoicePDF(invoice, customer);
      if (pdfUrl) {
        await this.supabase
          .from('invoices')
          .update({ pdf_url: pdfUrl })
          .eq('id', invoice.id);
      }

      // Clear customer cache
      await cache.del(`customer:${invoiceData.customerId}`);

      // Log invoice creation
      await auditLogger.logDataAccess(
        'invoice',
        invoice.id,
        createdByUserId,
        'create',
        undefined,
        invoice,
        {
          customerId: invoiceData.customerId,
          invoiceNumber,
          totalAmount
        }
      );

      monitoring.metrics.increment('invoice.created');

      return { invoice: invoice as Invoice, error: null };

    } catch (error: any) {
      logger.error('Create invoice failed', { error, invoiceData });
      monitoring.captureError(error);
      return { invoice: null, error: error.message || 'Failed to create invoice' };
    } finally {
      transaction.finish();
    }
  }

  /**
   * Send invoice to customer via email with payment link
   */
  async sendInvoice(
    invoiceId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const transaction = monitoring.startTransaction('invoice.send');
    
    try {
      // Get invoice with customer data
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .select(`
          *,
          customers(contact_name, email, service_address)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === 'paid') {
        return { success: false, error: 'Invoice is already paid' };
      }

      // Create Stripe customer if needed
      const stripeCustomer = await StripeCustomerManager.upsertCustomer({
        id: invoice.customers.stripe_customer_id,
        email: invoice.customers.email,
        name: invoice.customers.contact_name,
        address: invoice.customers.service_address ? {
          line1: invoice.customers.service_address.street,
          city: invoice.customers.service_address.city,
          state: invoice.customers.service_address.state,
          postal_code: invoice.customers.service_address.zip,
          country: 'US'
        } : undefined,
        metadata: {
          customer_id: invoice.customer_id,
          invoice_id: invoiceId
        }
      });

      // Create Stripe checkout session
      const checkoutUrl = await StripePaymentProcessor.createCheckoutSession(
        stripeCustomer.id,
        invoice.line_items.map(item => ({
          description: item.description,
          amount: item.amount,
          quantity: item.quantity
        })),
        `${process.env.NEXT_PUBLIC_APP_URL}/portal/payment/success?invoice=${invoiceId}`,
        `${process.env.NEXT_PUBLIC_APP_URL}/portal/payment/cancelled?invoice=${invoiceId}`,
        {
          invoice_id: invoiceId,
          customer_id: invoice.customer_id
        }
      );

      // Send email with payment link
      await this.emailService.send({
        to: invoice.customers.email,
        subject: `Invoice ${invoice.invoice_number} from Fisher Backflows`,
        templateId: 'INVOICE',
        templateData: {
          customerName: invoice.customers.contact_name,
          invoiceNumber: invoice.invoice_number,
          issueDate: invoice.issue_date,
          dueDate: invoice.due_date,
          lineItems: invoice.line_items,
          subtotal: invoice.subtotal.toFixed(2),
          tax: invoice.tax_amount.toFixed(2),
          total: invoice.total_amount.toFixed(2),
          paymentUrl: checkoutUrl,
          pdfUrl: invoice.pdf_url
        },
        attachments: invoice.pdf_url ? [{
          filename: `invoice-${invoice.invoice_number}.pdf`,
          content: invoice.pdf_url,
          contentType: 'application/pdf'
        }] : undefined
      });

      // Update invoice status and sent date
      await this.supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_date: new Date().toISOString(),
          stripe_customer_id: stripeCustomer.id
        })
        .eq('id', invoiceId);

      // Log invoice sent
      await auditLogger.logEvent({
        eventType: AuditEventType.INVOICE_SENT,
        userId,
        entityType: 'invoice',
        entityId: invoiceId,
        metadata: {
          invoiceNumber: invoice.invoice_number,
          customerEmail: invoice.customers.email,
          totalAmount: invoice.total_amount,
          paymentUrl: checkoutUrl
        },
        success: true,
        severity: 'low'
      });

      monitoring.metrics.increment('invoice.sent');

      return { success: true };

    } catch (error: any) {
      logger.error('Send invoice failed', { error, invoiceId });
      monitoring.captureError(error);
      return { success: false, error: error.message || 'Failed to send invoice' };
    } finally {
      transaction.finish();
    }
  }

  /**
   * Process payment for invoice with real Stripe integration
   */
  async processInvoicePayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      paymentMethodId: string;
      savePaymentMethod?: boolean;
      customerEmail?: string;
    },
    userId?: string
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    const transaction = monitoring.startTransaction('payment.process');
    
    try {
      // Get invoice
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .select(`
          *,
          customers(id, email, contact_name, stripe_customer_id)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.balance_due <= 0) {
        return { success: false, error: 'Invoice is already paid' };
      }

      if (paymentData.amount > invoice.balance_due) {
        return { success: false, error: 'Payment amount exceeds balance due' };
      }

      // Get or create Stripe customer
      let stripeCustomerId = invoice.customers.stripe_customer_id;
      if (!stripeCustomerId) {
        const stripeCustomer = await StripeCustomerManager.upsertCustomer({
          email: invoice.customers.email,
          name: invoice.customers.contact_name,
          metadata: {
            customer_id: invoice.customer_id
          }
        });
        stripeCustomerId = stripeCustomer.id;
        
        // Update customer with Stripe ID
        await this.supabase
          .from('customers')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', invoice.customer_id);
      }

      // Process payment with Stripe
      const paymentResult = await StripePaymentProcessor.processPayment(
        stripeCustomerId,
        paymentData.paymentMethodId,
        paymentData.amount,
        invoiceId,
        paymentData.savePaymentMethod
      );

      if (!paymentResult.success) {
        // Record failed payment
        await this.recordPayment({
          customerId: invoice.customer_id,
          invoiceId,
          amount: paymentData.amount,
          status: 'failed',
          paymentMethod: 'credit_card',
          errorMessage: paymentResult.error
        });

        return { 
          success: false, 
          error: paymentResult.error || 'Payment processing failed' 
        };
      }

      // Calculate processing fee
      const processingFee = paymentData.amount * 0.029 + 0.30; // Stripe fees
      const netAmount = paymentData.amount - processingFee;

      // Record successful payment
      const payment = await this.recordPayment({
        customerId: invoice.customer_id,
        invoiceId,
        amount: paymentData.amount,
        status: 'completed',
        paymentMethod: 'credit_card',
        processingFee,
        netAmount,
        stripePaymentId: paymentResult.paymentId,
        stripeChargeId: paymentResult.chargeId,
        receiptUrl: paymentResult.receiptUrl
      });

      // Update invoice with payment
      const newPaidAmount = invoice.paid_amount + paymentData.amount;
      const newBalanceDue = invoice.total_amount - newPaidAmount;
      const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

      await this.supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          balance_due: newBalanceDue,
          status: newStatus,
          paid_date: newStatus === 'paid' ? new Date().toISOString() : null,
          payment_method: 'credit_card',
          payment_reference: paymentResult.paymentId
        })
        .eq('id', invoiceId);

      // Send payment confirmation email
      await this.sendPaymentConfirmation(invoice, payment, paymentResult.receiptUrl);

      // Update customer lifetime value
      await this.updateCustomerMetrics(invoice.customer_id, paymentData.amount);

      // Log payment
      await auditLogger.logEvent({
        eventType: AuditEventType.PAYMENT_COMPLETED,
        userId,
        entityType: 'payment',
        entityId: payment.id,
        metadata: {
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          amount: paymentData.amount,
          paymentMethod: 'credit_card',
          customerId: invoice.customer_id
        },
        success: true,
        severity: 'medium'
      });

      monitoring.metrics.increment('payment.completed', 1, [`amount:${Math.floor(paymentData.amount)}`]);

      return { success: true, paymentId: payment.id };

    } catch (error: any) {
      logger.error('Process payment failed', { error, invoiceId, paymentData });
      monitoring.captureError(error);
      return { success: false, error: error.message || 'Payment processing failed' };
    } finally {
      transaction.finish();
    }
  }

  /**
   * Get invoice with payment history
   */
  async getInvoiceWithPayments(
    invoiceId: string
  ): Promise<{ invoice: Invoice | null; payments: Payment[]; error?: string }> {
    try {
      const [invoiceResult, paymentsResult] = await Promise.all([
        this.supabase
          .from('invoices')
          .select(`
            *,
            customers(contact_name, email, account_number),
            test_reports(certification_number),
            appointments(scheduled_date, service_type)
          `)
          .eq('id', invoiceId)
          .single(),
        
        this.supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('created_at', { ascending: false })
      ]);

      if (invoiceResult.error) {
        return { 
          invoice: null, 
          payments: [], 
          error: 'Invoice not found' 
        };
      }

      return {
        invoice: invoiceResult.data as Invoice,
        payments: (paymentsResult.data || []) as Payment[]
      };

    } catch (error: any) {
      logger.error('Get invoice with payments failed', { error, invoiceId });
      return { 
        invoice: null, 
        payments: [], 
        error: 'Failed to retrieve invoice' 
      };
    }
  }

  /**
   * Process refund for payment
   */
  async processRefund(
    paymentId: string,
    refundData: {
      amount?: number;
      reason: string;
      notifyCustomer?: boolean;
    },
    userId?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const transaction = monitoring.startTransaction('payment.refund');
    
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select(`
          *,
          invoices(invoice_number, customer_id),
          customers(contact_name, email)
        `)
        .eq('id', paymentId)
        .eq('status', 'completed')
        .single();

      if (paymentError || !payment) {
        return { success: false, error: 'Payment not found or not eligible for refund' };
      }

      const refundAmount = refundData.amount || payment.amount;
      
      if (refundAmount > (payment.amount - payment.refund_amount)) {
        return { success: false, error: 'Refund amount exceeds refundable amount' };
      }

      // Process refund with Stripe
      if (payment.stripe_payment_id) {
        const refundResult = await stripeService.refund.processRefund(
          payment.stripe_payment_id,
          refundAmount,
          refundData.reason
        );

        if (!refundResult.success) {
          return { success: false, error: refundResult.error };
        }

        // Update payment record
        await this.supabase
          .from('payments')
          .update({
            refund_amount: payment.refund_amount + refundAmount,
            refund_date: new Date().toISOString(),
            refund_reason: refundData.reason,
            status: refundAmount === payment.amount ? 'refunded' : 'completed'
          })
          .eq('id', paymentId);

        // Update invoice if full refund
        if (refundAmount === payment.amount) {
          await this.supabase
            .from('invoices')
            .update({
              paid_amount: payment.invoices.paid_amount - refundAmount,
              balance_due: payment.invoices.balance_due + refundAmount,
              status: 'sent' // Reset to sent status
            })
            .eq('id', payment.invoice_id);
        }

        // Send refund notification
        if (refundData.notifyCustomer) {
          await this.sendRefundNotification(payment, refundAmount, refundData.reason);
        }

        // Log refund
        await auditLogger.logEvent({
          eventType: AuditEventType.PAYMENT_REFUNDED,
          userId,
          entityType: 'payment',
          entityId: paymentId,
          metadata: {
            originalAmount: payment.amount,
            refundAmount,
            reason: refundData.reason,
            invoiceNumber: payment.invoices.invoice_number
          },
          success: true,
          severity: 'medium'
        });

        monitoring.metrics.increment('payment.refunded', 1, [`amount:${Math.floor(refundAmount)}`]);

        return { success: true, refundId: refundResult.refundId };
      }

      return { success: false, error: 'Cannot process refund for this payment method' };

    } catch (error: any) {
      logger.error('Process refund failed', { error, paymentId });
      monitoring.captureError(error);
      return { success: false, error: error.message || 'Refund processing failed' };
    } finally {
      transaction.finish();
    }
  }

  /**
   * Send payment reminders for overdue invoices
   */
  async sendPaymentReminders(): Promise<{ sent: number; errors: string[] }> {
    const transaction = monitoring.startTransaction('invoice.send_reminders');
    
    try {
      // Get overdue invoices
      const { data: overdueInvoices, error } = await this.supabase
        .from('invoices')
        .select(`
          *,
          customers(contact_name, email, account_number)
        `)
        .eq('status', 'sent')
        .lt('due_date', new Date().toISOString().split('T')[0])
        .gt('balance_due', 0)
        .lt('reminder_count', 3); // Max 3 reminders

      if (error || !overdueInvoices) {
        throw new Error('Failed to get overdue invoices');
      }

      let sent = 0;
      const errors: string[] = [];

      for (const invoice of overdueInvoices) {
        try {
          const daysPastDue = Math.floor(
            (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Send reminder email
          await this.emailService.send({
            to: invoice.customers.email,
            subject: `Payment Reminder - Invoice ${invoice.invoice_number} (${daysPastDue} days overdue)`,
            templateId: 'PAYMENT_REMINDER',
            templateData: {
              customerName: invoice.customers.contact_name,
              invoiceNumber: invoice.invoice_number,
              totalAmount: invoice.total_amount.toFixed(2),
              balanceDue: invoice.balance_due.toFixed(2),
              daysPastDue,
              paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/pay/${invoice.id}`,
              pdfUrl: invoice.pdf_url
            }
          });

          // Update reminder count
          await this.supabase
            .from('invoices')
            .update({
              reminder_count: invoice.reminder_count + 1,
              last_reminder_date: new Date().toISOString(),
              status: 'overdue'
            })
            .eq('id', invoice.id);

          sent++;

        } catch (error: any) {
          errors.push(`Invoice ${invoice.invoice_number}: ${error.message}`);
        }
      }

      monitoring.metrics.increment('invoice.reminders_sent', sent);

      return { sent, errors };

    } catch (error: any) {
      logger.error('Send payment reminders failed', { error });
      monitoring.captureError(error);
      return { sent: 0, errors: [error.message] };
    } finally {
      transaction.finish();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════

  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Get count of invoices this month
    const { count } = await this.supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .gte('created_at', `${year}-${month.toString().padStart(2, '0')}-01`);

    const sequence = (count || 0) + 1;
    
    return `INV-${year}${month.toString().padStart(2, '0')}-${sequence.toString().padStart(4, '0')}`;
  }

  private calculateDueDate(paymentTerms: number): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate.toISOString().split('T')[0];
  }

  private async recordPayment(paymentData: {
    customerId: string;
    invoiceId?: string;
    amount: number;
    status: string;
    paymentMethod: string;
    processingFee?: number;
    netAmount?: number;
    stripePaymentId?: string;
    stripeChargeId?: string;
    receiptUrl?: string;
    errorMessage?: string;
  }): Promise<Payment> {
    const { data: payment, error } = await this.supabase
      .from('payments')
      .insert({
        customer_id: paymentData.customerId,
        invoice_id: paymentData.invoiceId,
        status: paymentData.status,
        amount: paymentData.amount,
        currency: 'USD',
        payment_method: paymentData.paymentMethod,
        payment_date: new Date().toISOString(),
        processing_fee: paymentData.processingFee || 0,
        net_amount: paymentData.netAmount || paymentData.amount,
        stripe_payment_id: paymentData.stripePaymentId,
        stripe_charge_id: paymentData.stripeChargeId,
        reference_number: paymentData.receiptUrl,
        notes: paymentData.errorMessage,
        refund_amount: 0,
        metadata: {
          receipt_url: paymentData.receiptUrl
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return payment as Payment;
  }

  private async generateInvoicePDF(invoice: any, customer: any): Promise<string | null> {
    try {
      // Real PDF generation using jsPDF
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Fisher Backflows', 20, 20);
      doc.setFontSize(16);
      doc.text('INVOICE', 20, 35);
      
      // Invoice details
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 55);
      doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 65);
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 75);
      
      // Customer information
      doc.text('Bill To:', 20, 95);
      doc.text(`${customer.name}`, 20, 105);
      doc.text(`${customer.email}`, 20, 115);
      doc.text(`${customer.address || ''}`, 20, 125);
      
      // Invoice items
      let yPosition = 150;
      doc.text('Description', 20, yPosition);
      doc.text('Amount', 150, yPosition);
      doc.line(20, yPosition + 5, 190, yPosition + 5);
      
      yPosition += 15;
      if (invoice.line_items && Array.isArray(invoice.line_items)) {
        invoice.line_items.forEach((item: any) => {
          doc.text(item.description || 'Service', 20, yPosition);
          doc.text(`$${item.amount?.toFixed(2) || '0.00'}`, 150, yPosition);
          yPosition += 10;
        });
      } else {
        doc.text(invoice.description || 'Backflow Testing Service', 20, yPosition);
        doc.text(`$${invoice.amount?.toFixed(2) || '0.00'}`, 150, yPosition);
        yPosition += 10;
      }
      
      // Totals
      yPosition += 10;
      doc.line(140, yPosition, 190, yPosition);
      yPosition += 10;
      doc.text(`Subtotal: $${invoice.amount?.toFixed(2) || '0.00'}`, 140, yPosition);
      if (invoice.tax_amount > 0) {
        yPosition += 10;
        doc.text(`Tax: $${invoice.tax_amount?.toFixed(2) || '0.00'}`, 140, yPosition);
      }
      yPosition += 10;
      doc.setFontSize(14);
      doc.text(`Total: $${invoice.total_amount?.toFixed(2) || '0.00'}`, 140, yPosition);
      
      // Footer
      doc.setFontSize(10);
      doc.text('Thank you for your business!', 20, yPosition + 30);
      doc.text('Contact: mike@fisherbackflows.com | (253) 555-0123', 20, yPosition + 40);
      
      // Generate PDF buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      // Upload to storage
      const fileName = `invoice-${invoice.invoice_number}-${Date.now()}.pdf`;
      const { supabase } = await import('@/lib/supabase');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          metadata: {
            invoice_id: invoice.id,
            customer_id: customer.id,
            generated_at: new Date().toISOString()
          }
        });
      
      if (uploadError) {
        throw new Error(`PDF upload failed: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);
      
      // Update invoice with PDF path
      await supabase
        .from('invoices')
        .update({ pdf_path: publicUrlData.publicUrl })
        .eq('id', invoice.id);
      
      logger.info('Invoice PDF generated successfully', { 
        invoiceId: invoice.id, 
        fileName,
        url: publicUrlData.publicUrl 
      });
      
      return publicUrlData.publicUrl;
      
    } catch (error: any) {
      logger.error('PDF generation failed', { error: error.message, invoiceId: invoice.id });
      return null;
    }
  }

  private async sendPaymentConfirmation(
    invoice: any, 
    payment: Payment, 
    receiptUrl?: string
  ): Promise<void> {
    try {
      await this.emailService.send({
        to: invoice.customers.email,
        subject: `Payment Received - Invoice ${invoice.invoice_number}`,
        templateId: 'PAYMENT_RECEIVED',
        templateData: {
          customerName: invoice.customers.contact_name,
          invoiceNumber: invoice.invoice_number,
          paymentAmount: payment.amount.toFixed(2),
          paymentDate: payment.payment_date,
          paymentMethod: payment.payment_method,
          remainingBalance: (invoice.total_amount - invoice.paid_amount - payment.amount).toFixed(2),
          receiptUrl
        }
      });
    } catch (error) {
      logger.error('Failed to send payment confirmation', { error, paymentId: payment.id });
    }
  }

  private async sendRefundNotification(
    payment: any, 
    refundAmount: number, 
    reason: string
  ): Promise<void> {
    try {
      await this.emailService.send({
        to: payment.customers.email,
        subject: `Refund Processed - Invoice ${payment.invoices.invoice_number}`,
        templateId: 'REFUND_PROCESSED',
        templateData: {
          customerName: payment.customers.contact_name,
          invoiceNumber: payment.invoices.invoice_number,
          refundAmount: refundAmount.toFixed(2),
          originalAmount: payment.amount.toFixed(2),
          reason,
          refundDate: new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      logger.error('Failed to send refund notification', { error, paymentId: payment.id });
    }
  }

  private async updateCustomerMetrics(customerId: string, paymentAmount: number): Promise<void> {
    try {
      // Update customer lifetime value
      const { data: customer } = await this.supabase
        .from('customers')
        .select('lifetime_value, balance')
        .eq('id', customerId)
        .single();

      if (customer) {
        await this.supabase
          .from('customers')
          .update({
            lifetime_value: customer.lifetime_value + paymentAmount,
            balance: customer.balance - paymentAmount
          })
          .eq('id', customerId);
      }
    } catch (error) {
      logger.error('Failed to update customer metrics', { error, customerId });
    }
  }
}

// Export singleton
export const invoicePaymentService = new InvoicePaymentService();
export default invoicePaymentService;