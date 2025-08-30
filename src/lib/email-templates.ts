/**
 * Email Template System
 * Provides pre-built email templates for customer communications
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'appointment' | 'reminder' | 'invoice' | 'compliance' | 'general';
  variables: string[];
  htmlTemplate: string;
  textTemplate: string;
  description: string;
  isActive: boolean;
}

export interface EmailContext {
  customer?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    accountNumber?: string;
  };
  appointment?: {
    date: string;
    time: string;
    technician: string;
    serviceType: string;
    estimatedDuration: number;
    notes?: string;
  };
  invoice?: {
    number: string;
    amount: number;
    dueDate: string;
    description: string;
    paymentLink?: string;
  };
  testReport?: {
    testDate: string;
    results: string;
    compliance: string;
    nextTestDate?: string;
  };
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  customFields?: Record<string, any>;
}

class EmailTemplateService {
  private templates: EmailTemplate[] = [
    // Appointment Templates
    {
      id: 'appointment-confirmation',
      name: 'Appointment Confirmation',
      subject: 'Appointment Confirmed: {{appointment.serviceType}} on {{appointment.date}}',
      category: 'appointment',
      variables: ['customer.name', 'appointment.date', 'appointment.time', 'appointment.technician', 'appointment.serviceType'],
      description: 'Sent when an appointment is scheduled or confirmed',
      isActive: true,
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">{{company.name}}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Backflow Testing Services</p>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #0066cc; margin-bottom: 20px;">Appointment Confirmed</h2>
            
            <p>Dear {{customer.name}},</p>
            
            <p>Your appointment has been confirmed for <strong>{{appointment.serviceType}}</strong>.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0066cc;">Appointment Details</h3>
              <p><strong>Date:</strong> {{appointment.date}}</p>
              <p><strong>Time:</strong> {{appointment.time}}</p>
              <p><strong>Service:</strong> {{appointment.serviceType}}</p>
              <p><strong>Technician:</strong> {{appointment.technician}}</p>
              <p><strong>Estimated Duration:</strong> {{appointment.estimatedDuration}} minutes</p>
              {{#if appointment.notes}}
              <p><strong>Notes:</strong> {{appointment.notes}}</p>
              {{/if}}
            </div>
            
            <h3 style="color: #0066cc;">What to Expect</h3>
            <ul style="line-height: 1.6;">
              <li>Our certified technician will arrive at the scheduled time</li>
              <li>Testing typically takes 30-60 minutes depending on your system</li>
              <li>You'll receive a detailed report upon completion</li>
              <li>Payment can be made by cash, check, or card</li>
            </ul>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0;"><strong>Important:</strong> Please ensure water access is available and the testing area is clear.</p>
            </div>
            
            <p>If you need to reschedule or have questions, please call us at <a href="tel:{{company.phone}}" style="color: #0066cc;">{{company.phone}}</a>.</p>
            
            <p>Thank you for choosing {{company.name}}!</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              {{company.name}} | {{company.address}} | {{company.phone}} | {{company.email}}
            </p>
          </div>
        </div>
      `,
      textTemplate: `
        {{company.name}} - Appointment Confirmed
        
        Dear {{customer.name}},
        
        Your appointment has been confirmed for {{appointment.serviceType}}.
        
        APPOINTMENT DETAILS:
        Date: {{appointment.date}}
        Time: {{appointment.time}}
        Service: {{appointment.serviceType}}
        Technician: {{appointment.technician}}
        Duration: {{appointment.estimatedDuration}} minutes
        {{#if appointment.notes}}
        Notes: {{appointment.notes}}
        {{/if}}
        
        WHAT TO EXPECT:
        - Our certified technician will arrive at the scheduled time
        - Testing typically takes 30-60 minutes depending on your system
        - You'll receive a detailed report upon completion
        - Payment can be made by cash, check, or card
        
        IMPORTANT: Please ensure water access is available and the testing area is clear.
        
        If you need to reschedule or have questions, please call us at {{company.phone}}.
        
        Thank you for choosing {{company.name}}!
        
        {{company.name}}
        {{company.address}}
        {{company.phone}} | {{company.email}}
      `
    },

    // Reminder Templates
    {
      id: 'appointment-reminder',
      name: 'Appointment Reminder',
      subject: 'Reminder: Your {{appointment.serviceType}} appointment is tomorrow',
      category: 'reminder',
      variables: ['customer.name', 'appointment.date', 'appointment.time', 'appointment.technician'],
      description: 'Sent 24 hours before scheduled appointment',
      isActive: true,
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Appointment Reminder</h1>
          </div>
          
          <div style="padding: 30px;">
            <p>Hello {{customer.name}},</p>
            
            <p>This is a friendly reminder that your appointment is scheduled for <strong>tomorrow</strong>.</p>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #155724;">Tomorrow's Appointment</h3>
              <p><strong>Date:</strong> {{appointment.date}}</p>
              <p><strong>Time:</strong> {{appointment.time}}</p>
              <p><strong>Technician:</strong> {{appointment.technician}}</p>
            </div>
            
            <p><strong>Preparation Checklist:</strong></p>
            <ul>
              <li>✓ Ensure clear access to backflow prevention device</li>
              <li>✓ Turn off automatic sprinkler systems</li>
              <li>✓ Have previous test reports available (if applicable)</li>
            </ul>
            
            <p>Questions? Call us at <a href="tel:{{company.phone}}" style="color: #28a745;">{{company.phone}}</a>.</p>
            
            <p>See you tomorrow!</p>
          </div>
        </div>
      `,
      textTemplate: `
        APPOINTMENT REMINDER
        
        Hello {{customer.name}},
        
        This is a friendly reminder that your appointment is scheduled for tomorrow.
        
        TOMORROW'S APPOINTMENT:
        Date: {{appointment.date}}
        Time: {{appointment.time}}
        Technician: {{appointment.technician}}
        
        PREPARATION CHECKLIST:
        ✓ Ensure clear access to backflow prevention device
        ✓ Turn off automatic sprinkler systems
        ✓ Have previous test reports available (if applicable)
        
        Questions? Call us at {{company.phone}}.
        
        See you tomorrow!
        
        {{company.name}}
      `
    },

    // Invoice Templates
    {
      id: 'invoice-sent',
      name: 'Invoice Notification',
      subject: 'Invoice #{{invoice.number}} - {{company.name}}',
      category: 'invoice',
      variables: ['customer.name', 'invoice.number', 'invoice.amount', 'invoice.dueDate', 'invoice.paymentLink'],
      description: 'Sent when an invoice is generated and sent to customer',
      isActive: true,
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Invoice</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">{{company.name}}</p>
          </div>
          
          <div style="padding: 30px;">
            <p>Dear {{customer.name}},</p>
            
            <p>Thank you for choosing our services. Your invoice is ready for review.</p>
            
            <div style="background-color: #e8f4f8; border: 1px solid #b8daff; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #0c5460;">Invoice Details</h3>
              <p><strong>Invoice Number:</strong> {{invoice.number}}</p>
              <p><strong>Amount Due:</strong> ${'{{invoice.amount}}'}</p>
              <p><strong>Due Date:</strong> {{invoice.dueDate}}</p>
              <p><strong>Service:</strong> {{invoice.description}}</p>
            </div>
            
            {{#if invoice.paymentLink}}
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{invoice.paymentLink}}" 
                 style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Pay Online Now
              </a>
            </div>
            {{/if}}
            
            <h3 style="color: #17a2b8;">Payment Options</h3>
            <ul>
              <li><strong>Online:</strong> Use the link above for secure payment</li>
              <li><strong>Phone:</strong> Call {{company.phone}} to pay over the phone</li>
              <li><strong>Check:</strong> Mail to {{company.address}}</li>
            </ul>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0;"><strong>Note:</strong> Payment is due within 30 days of service completion to avoid late fees.</p>
            </div>
            
            <p>Questions about your invoice? Contact us at {{company.email}} or {{company.phone}}.</p>
            
            <p>Thank you for your business!</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              {{company.name}} | {{company.address}} | {{company.phone}} | {{company.email}}
            </p>
          </div>
        </div>
      `,
      textTemplate: `
        INVOICE FROM {{company.name}}
        
        Dear {{customer.name}},
        
        Thank you for choosing our services. Your invoice is ready for review.
        
        INVOICE DETAILS:
        Invoice Number: {{invoice.number}}
        Amount Due: ${'{{invoice.amount}}'}
        Due Date: {{invoice.dueDate}}
        Service: {{invoice.description}}
        
        PAYMENT OPTIONS:
        - Online: {{invoice.paymentLink}}
        - Phone: Call {{company.phone}} to pay over the phone
        - Check: Mail to {{company.address}}
        
        NOTE: Payment is due within 30 days of service completion to avoid late fees.
        
        Questions? Contact us at {{company.email}} or {{company.phone}}.
        
        Thank you for your business!
        
        {{company.name}}
        {{company.address}}
        {{company.phone}} | {{company.email}}
      `
    },

    // Compliance Templates
    {
      id: 'test-report-complete',
      name: 'Test Report Complete',
      subject: 'Your Backflow Test Report is Ready - {{customer.name}}',
      category: 'compliance',
      variables: ['customer.name', 'testReport.testDate', 'testReport.results', 'testReport.compliance', 'testReport.nextTestDate'],
      description: 'Sent when test report is completed and ready for customer review',
      isActive: true,
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Test Report Complete</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">{{company.name}}</p>
          </div>
          
          <div style="padding: 30px;">
            <p>Dear {{customer.name}},</p>
            
            <p>Your backflow prevention device testing has been completed. Here's your report summary:</p>
            
            <div style="background-color: #f8f9fe; border: 1px solid #d1c4e9; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #6f42c1;">Test Results</h3>
              <p><strong>Test Date:</strong> {{testReport.testDate}}</p>
              <p><strong>Results:</strong> {{testReport.results}}</p>
              <p><strong>Compliance Status:</strong> 
                <span style="color: {{#eq testReport.compliance 'Compliant'}}#28a745{{else}}#dc3545{{/eq}}; font-weight: bold;">
                  {{testReport.compliance}}
                </span>
              </p>
              {{#if testReport.nextTestDate}}
              <p><strong>Next Test Due:</strong> {{testReport.nextTestDate}}</p>
              {{/if}}
            </div>
            
            {{#eq testReport.compliance 'Compliant'}}
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #155724;"><strong>✓ Good News!</strong> Your device passed all tests and meets compliance requirements.</p>
            </div>
            {{else}}
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #721c24;"><strong>⚠ Action Required:</strong> Your device requires attention to meet compliance standards. We'll contact you to schedule repairs.</p>
            </div>
            {{/eq}}
            
            <p>A detailed report has been filed with the appropriate water authority as required by law.</p>
            
            <p>If you have questions about your report, please contact us at {{company.phone}} or {{company.email}}.</p>
            
            <p>Thank you for maintaining your backflow prevention system!</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              {{company.name}} | {{company.address}} | {{company.phone}} | {{company.email}}
            </p>
          </div>
        </div>
      `,
      textTemplate: `
        TEST REPORT COMPLETE - {{company.name}}
        
        Dear {{customer.name}},
        
        Your backflow prevention device testing has been completed.
        
        TEST RESULTS:
        Test Date: {{testReport.testDate}}
        Results: {{testReport.results}}
        Compliance Status: {{testReport.compliance}}
        {{#if testReport.nextTestDate}}
        Next Test Due: {{testReport.nextTestDate}}
        {{/if}}
        
        {{#eq testReport.compliance 'Compliant'}}
        ✓ GOOD NEWS! Your device passed all tests and meets compliance requirements.
        {{else}}
        ⚠ ACTION REQUIRED: Your device requires attention to meet compliance standards. We'll contact you to schedule repairs.
        {{/eq}}
        
        A detailed report has been filed with the appropriate water authority as required by law.
        
        Questions? Contact us at {{company.phone}} or {{company.email}}.
        
        Thank you for maintaining your backflow prevention system!
        
        {{company.name}}
        {{company.address}}
        {{company.phone}} | {{company.email}}
      `
    },

    // General Templates
    {
      id: 'welcome-new-customer',
      name: 'Welcome New Customer',
      subject: 'Welcome to {{company.name}} - {{customer.name}}',
      category: 'general',
      variables: ['customer.name', 'customer.accountNumber'],
      description: 'Sent to new customers when they register or are added to the system',
      isActive: true,
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">Welcome!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">{{company.name}}</p>
          </div>
          
          <div style="padding: 30px;">
            <p>Dear {{customer.name}},</p>
            
            <p>Welcome to {{company.name}}! We're excited to serve your backflow prevention testing needs.</p>
            
            <div style="background-color: #fff5f5; border: 1px solid #fed7d7; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #c53030;">Your Account Details</h3>
              {{#if customer.accountNumber}}
              <p><strong>Account Number:</strong> {{customer.accountNumber}}</p>
              {{/if}}
              <p><strong>Primary Contact:</strong> {{customer.email}}</p>
            </div>
            
            <h3 style="color: #ff6b6b;">What's Next?</h3>
            <ul style="line-height: 1.8;">
              <li><strong>Schedule Testing:</strong> We'll contact you to schedule your annual testing</li>
              <li><strong>Compliance Management:</strong> We handle all water authority reporting</li>
              <li><strong>Maintenance Reminders:</strong> Receive automatic reminders for upcoming tests</li>
              <li><strong>Online Portal:</strong> Access reports and schedules anytime</li>
            </ul>
            
            <div style="background-color: #e6fffa; border: 1px solid #b2f5ea; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #234e52;"><strong>💡 Pro Tip:</strong> Keep our contact information handy for any backflow prevention questions or emergencies.</p>
            </div>
            
            <p>Have questions? We're here to help:</p>
            <ul>
              <li><strong>Phone:</strong> <a href="tel:{{company.phone}}" style="color: #ff6b6b;">{{company.phone}}</a></li>
              <li><strong>Email:</strong> <a href="mailto:{{company.email}}" style="color: #ff6b6b;">{{company.email}}</a></li>
              <li><strong>Website:</strong> <a href="{{company.website}}" style="color: #ff6b6b;">{{company.website}}</a></li>
            </ul>
            
            <p>Thank you for choosing {{company.name}} for your backflow prevention needs!</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              {{company.name}} | {{company.address}} | {{company.phone}} | {{company.email}}
            </p>
          </div>
        </div>
      `,
      textTemplate: `
        WELCOME TO {{company.name}}!
        
        Dear {{customer.name}},
        
        Welcome to {{company.name}}! We're excited to serve your backflow prevention testing needs.
        
        YOUR ACCOUNT DETAILS:
        {{#if customer.accountNumber}}
        Account Number: {{customer.accountNumber}}
        {{/if}}
        Primary Contact: {{customer.email}}
        
        WHAT'S NEXT?
        - Schedule Testing: We'll contact you to schedule your annual testing
        - Compliance Management: We handle all water authority reporting
        - Maintenance Reminders: Receive automatic reminders for upcoming tests
        - Online Portal: Access reports and schedules anytime
        
        💡 PRO TIP: Keep our contact information handy for any backflow prevention questions or emergencies.
        
        HAVE QUESTIONS? WE'RE HERE TO HELP:
        Phone: {{company.phone}}
        Email: {{company.email}}
        Website: {{company.website}}
        
        Thank you for choosing {{company.name}} for your backflow prevention needs!
        
        {{company.name}}
        {{company.address}}
        {{company.phone}} | {{company.email}}
      `
    }
  ];

  /**
   * Get all available templates
   */
  getTemplates(): EmailTemplate[] {
    return this.templates.filter(template => template.isActive);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
    return this.templates.filter(template => 
      template.category === category && template.isActive
    );
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): EmailTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  /**
   * Render template with context data
   */
  renderTemplate(templateId: string, context: EmailContext): { subject: string; html: string; text: string } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    // Simple template rendering (in production, use a proper template engine like Handlebars)
    const rendered = {
      subject: this.interpolateTemplate(template.subject, context),
      html: this.interpolateTemplate(template.htmlTemplate, context),
      text: this.interpolateTemplate(template.textTemplate, context)
    };

    return rendered;
  }

  /**
   * Simple template interpolation
   */
  private interpolateTemplate(template: string, context: EmailContext): string {
    let rendered = template;

    // Handle company info
    if (context.company) {
      rendered = rendered.replace(/\{\{company\.name\}\}/g, context.company.name || '');
      rendered = rendered.replace(/\{\{company\.address\}\}/g, context.company.address || '');
      rendered = rendered.replace(/\{\{company\.phone\}\}/g, context.company.phone || '');
      rendered = rendered.replace(/\{\{company\.email\}\}/g, context.company.email || '');
      rendered = rendered.replace(/\{\{company\.website\}\}/g, context.company.website || '');
    }

    // Handle customer info
    if (context.customer) {
      rendered = rendered.replace(/\{\{customer\.name\}\}/g, context.customer.name || '');
      rendered = rendered.replace(/\{\{customer\.email\}\}/g, context.customer.email || '');
      rendered = rendered.replace(/\{\{customer\.phone\}\}/g, context.customer.phone || '');
      rendered = rendered.replace(/\{\{customer\.address\}\}/g, context.customer.address || '');
      rendered = rendered.replace(/\{\{customer\.accountNumber\}\}/g, context.customer.accountNumber || '');
    }

    // Handle appointment info
    if (context.appointment) {
      rendered = rendered.replace(/\{\{appointment\.date\}\}/g, context.appointment.date || '');
      rendered = rendered.replace(/\{\{appointment\.time\}\}/g, context.appointment.time || '');
      rendered = rendered.replace(/\{\{appointment\.technician\}\}/g, context.appointment.technician || '');
      rendered = rendered.replace(/\{\{appointment\.serviceType\}\}/g, context.appointment.serviceType || '');
      rendered = rendered.replace(/\{\{appointment\.estimatedDuration\}\}/g, context.appointment.estimatedDuration?.toString() || '');
      rendered = rendered.replace(/\{\{appointment\.notes\}\}/g, context.appointment.notes || '');
    }

    // Handle invoice info
    if (context.invoice) {
      rendered = rendered.replace(/\{\{invoice\.number\}\}/g, context.invoice.number || '');
      rendered = rendered.replace(/\{\{invoice\.amount\}\}/g, context.invoice.amount?.toFixed(2) || '');
      rendered = rendered.replace(/\{\{invoice\.dueDate\}\}/g, context.invoice.dueDate || '');
      rendered = rendered.replace(/\{\{invoice\.description\}\}/g, context.invoice.description || '');
      rendered = rendered.replace(/\{\{invoice\.paymentLink\}\}/g, context.invoice.paymentLink || '');
    }

    // Handle test report info
    if (context.testReport) {
      rendered = rendered.replace(/\{\{testReport\.testDate\}\}/g, context.testReport.testDate || '');
      rendered = rendered.replace(/\{\{testReport\.results\}\}/g, context.testReport.results || '');
      rendered = rendered.replace(/\{\{testReport\.compliance\}\}/g, context.testReport.compliance || '');
      rendered = rendered.replace(/\{\{testReport\.nextTestDate\}\}/g, context.testReport.nextTestDate || '');
    }

    // Handle custom fields
    if (context.customFields) {
      Object.keys(context.customFields).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        rendered = rendered.replace(regex, context.customFields![key]?.toString() || '');
      });
    }

    // Clean up any remaining template variables
    rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

    // Handle simple conditionals (basic implementation)
    rendered = this.handleConditionals(rendered, context);

    return rendered;
  }

  /**
   * Handle basic conditional logic in templates
   */
  private handleConditionals(template: string, context: EmailContext): string {
    let rendered = template;

    // Handle {{#if variable}} blocks
    const ifRegex = /\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    rendered = rendered.replace(ifRegex, (match, condition, content) => {
      const value = this.getNestedValue(context, condition.trim());
      return value ? content : '';
    });

    // Handle {{#eq variable value}} blocks
    const eqRegex = /\{\{#eq ([^}]+) ([^}]+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/eq\}\}/g;
    rendered = rendered.replace(eqRegex, (match, variable, expectedValue, trueContent, falseContent) => {
      const actualValue = this.getNestedValue(context, variable.trim());
      const expected = expectedValue.replace(/'/g, '');
      return actualValue === expected ? trueContent : falseContent;
    });

    return rendered;
  }

  /**
   * Get nested object value by dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Add custom template
   */
  addTemplate(template: Omit<EmailTemplate, 'id'>): string {
    const id = `custom-${Date.now()}`;
    this.templates.push({ ...template, id });
    return id;
  }

  /**
   * Update existing template
   */
  updateTemplate(id: string, updates: Partial<EmailTemplate>): boolean {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return false;

    this.templates[index] = { ...this.templates[index], ...updates };
    return true;
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    return true;
  }
}

// Export singleton instance
export const emailTemplateService = new EmailTemplateService();

// Default company context for templates
export const getDefaultCompanyContext = (): EmailContext['company'] => ({
  name: 'Fisher Backflows',
  address: '123 Main Street, Springfield, ST 12345',
  phone: '(555) 123-4567',
  email: 'info@fisherbackflows.com',
  website: 'https://www.fisherbackflows.com'
});

export default emailTemplateService;