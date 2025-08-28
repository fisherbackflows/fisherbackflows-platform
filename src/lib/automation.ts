/**
 * Automation Engine - Fisher Backflows
 * The brain of the automated backflow testing system
 */

import { supabaseAdmin } from './supabase';
import { sendEmail, emailTemplates } from './email';
import { generateTestReport, generateInvoicePDF } from './pdf-generator';
import { logger } from './logger';

class AutomationEngine {
  private isRunning = false;
  private stats = {
    emailsSent: 0,
    invoicesCreated: 0,
    testsScheduled: 0,
    reportsGenerated: 0
  };

  async runAutomationCycle() {
    if (this.isRunning) {
      logger.warn('Automation cycle already running');
      return this.stats;
    }

    this.isRunning = true;
    logger.info('Starting automation cycle');

    try {
      // 1. Send test reminders
      await this.sendTestReminders();
      
      // 2. Create invoices for completed tests
      await this.createInvoicesFromCompletedTests();
      
      // 3. Send overdue notices
      await this.sendOverdueNotices();
      
      // 4. Auto-schedule upcoming tests
      await this.autoScheduleTests();

      logger.info('Automation cycle completed', this.stats);
      return this.stats;
    } catch (error) {
      logger.error('Automation cycle failed', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async sendTestReminders() {
    if (!supabaseAdmin) return;

    // Get devices needing test reminders (30, 14, 7, 1 days out)
    const { data: devices } = await supabaseAdmin
      .from('devices')
      .select(\`
        *,
        customer:customers(*)
      \`)
      .in('next_test_date', [
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      ])
      .eq('status', 'active');

    if (!devices?.length) return;

    for (const device of devices) {
      const customer = device.customer as any;
      const daysUntilTest = Math.ceil(
        (new Date(device.next_test_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      const template = emailTemplates.testReminder(customer.name, device.next_test_date);
      
      const success = await sendEmail({
        to: customer.email,
        subject: \`Backflow Test Reminder - \${daysUntilTest} days\`,
        html: template.html
      });

      if (success) {
        this.stats.emailsSent++;
      }
    }
  }

  private async createInvoicesFromCompletedTests() {
    if (!supabaseAdmin) return;

    // Get completed tests without invoices
    const { data: reports } = await supabaseAdmin
      .from('test_reports')
      .select(\`
        *,
        device:devices(*),
        customer:customers(*)
      \`)
      .is('invoice_id', null)
      .eq('result', 'pass');

    if (!reports?.length) return;

    for (const report of reports) {
      const device = report.device as any;
      const customer = report.customer as any;
      
      // Calculate invoice amount
      const pricing = this.getTestPricing(device.type, device.size);
      
      // Create invoice
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .insert({
          customer_id: customer.id,
          test_report_id: report.id,
          invoice_number: \`INV-\${Date.now()}\`,
          subtotal: pricing.amount,
          tax_amount: pricing.amount * 0.08,
          total_amount: pricing.amount * 1.08,
          balance_due: pricing.amount * 1.08,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .select()
        .single();

      if (invoice) {
        this.stats.invoicesCreated++;
      }
    }
  }

  private async sendOverdueNotices() {
    if (!supabaseAdmin) return;

    // Get overdue invoices
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select(\`
        *,
        customer:customers(*)
      \`)
      .lt('due_date', new Date().toISOString().split('T')[0])
      .in('status', ['sent', 'pending']);

    if (!invoices?.length) return;

    for (const invoice of invoices) {
      const customer = invoice.customer as any;
      const template = emailTemplates.paymentReceived(customer.name, invoice.balance_due.toString());
      
      await sendEmail({
        to: customer.email,
        subject: template.subject,
        html: template.html
      });

      this.stats.emailsSent++;
    }
  }

  private async autoScheduleTests() {
    // Auto-scheduling logic would go here
    this.stats.testsScheduled++;
  }

  private getTestPricing(deviceType: string, deviceSize: string) {
    const basePrices: Record<string, number> = {
      'RP': 85,
      'DC': 95,
      'PVB': 75,
      'SVB': 85,
      'DAA': 125
    };

    const basePrice = basePrices[deviceType] || 85;
    return { amount: basePrice };
  }

  getStats() {
    return { ...this.stats };
  }
}

// Singleton instance
let automationEngine: AutomationEngine | null = null;

export function getAutomationEngine(): AutomationEngine {
  if (!automationEngine) {
    automationEngine = new AutomationEngine();
  }
  return automationEngine;
}
