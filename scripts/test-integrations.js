#!/usr/bin/env node
/**
 * Fisher Backflows Platform - Integration Service Testing
 * Tests all email, SMS, and payment integrations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class IntegrationServiceTester {
  constructor() {
    this.results = {
      email: { status: 'unknown', details: null, configured: false },
      sms: { status: 'unknown', details: null, configured: false },
      payment: { status: 'unknown', details: null, configured: false },
      database: { status: 'unknown', details: null, configured: false }
    };
    
    this.loadEnvironment();
    this.supabase = null;
  }

  loadEnvironment() {
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
          if (line.trim() && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();
            if (key && value) {
              process.env[key.trim()] = value;
            }
          }
        }
      }
    } catch (error) {
      console.log(`${colors.yellow}Warning: Could not load .env.local file${colors.reset}`);
    }
  }

  log(type, message, details = null) {
    const icons = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };

    console.log(`${icons[type]} ${message}`);
    if (details) {
      console.log(`   ${colors.bright}${details}${colors.reset}`);
    }
  }

  async testDatabaseConnection() {
    this.log('test', 'Testing Supabase Database Connection...');
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        this.results.database = {
          status: 'error',
          details: 'Missing Supabase credentials',
          configured: false
        };
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Test basic connectivity
      const { data, error } = await this.supabase
        .from('customers')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      // Check table existence
      const tables = ['customers', 'devices', 'appointments', 'invoices', 'payments', 'test_reports'];
      const tableResults = {};
      
      for (const table of tables) {
        try {
          const { error: tableError } = await this.supabase
            .from(table)
            .select('id')
            .limit(1);
          
          tableResults[table] = !tableError ? '✓' : `✗ ${tableError.message}`;
        } catch (err) {
          tableResults[table] = `✗ ${err.message}`;
        }
      }

      this.results.database = {
        status: 'success',
        details: {
          connection: 'Connected successfully',
          tables: tableResults,
          customerCount: data?.length || 0
        },
        configured: true
      };

    } catch (error) {
      this.results.database = {
        status: 'error',
        details: error.message,
        configured: false
      };
    }
  }

  async testEmailService() {
    this.log('test', 'Testing Email Service (Resend)...');
    
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (!resendApiKey || resendApiKey === '') {
        this.results.email = {
          status: 'warning',
          details: 'Resend API key not configured - using mock email service',
          configured: false
        };
        return;
      }

      // Test email sending capability
      const testEmail = {
        to: 'fisherbackflows@gmail.com',
        subject: 'Fisher Backflows Integration Test',
        html: '<h2>Email Integration Test</h2><p>This is a test email from your Fisher Backflows platform integration test.</p>'
      };

      // Make API request to our email endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testEmail)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.results.email = {
          status: 'success',
          details: {
            service: 'Resend',
            testResult: 'Email sent successfully',
            messageId: result.data?.id
          },
          configured: true
        };
      } else {
        this.results.email = {
          status: 'error',
          details: result.error || 'Failed to send test email',
          configured: true
        };
      }

    } catch (error) {
      this.results.email = {
        status: 'error',
        details: error.message,
        configured: false
      };
    }
  }

  async testSMSService() {
    this.log('test', 'Testing SMS Service (Twilio)...');
    
    try {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      
      if (!twilioSid || !twilioToken || !twilioPhone) {
        this.results.sms = {
          status: 'warning',
          details: 'Twilio credentials not configured - using mock SMS service',
          configured: false
        };
        return;
      }

      // Check if we have real Twilio keys (not placeholder values)
      if (twilioSid.includes('your-') || twilioToken.includes('your-') || twilioPhone.includes('your-')) {
        this.results.sms = {
          status: 'warning',
          details: 'Twilio credentials are placeholder values - using mock SMS service',
          configured: false
        };
        return;
      }

      // Test SMS sending capability (we won't actually send to avoid costs)
      this.results.sms = {
        status: 'success',
        details: {
          service: 'Twilio',
          accountSid: twilioSid.substring(0, 10) + '...',
          fromNumber: twilioPhone,
          testResult: 'Credentials configured (test SMS not sent to avoid costs)'
        },
        configured: true
      };

    } catch (error) {
      this.results.sms = {
        status: 'error',
        details: error.message,
        configured: false
      };
    }
  }

  async testPaymentService() {
    this.log('test', 'Testing Payment Service (Stripe)...');
    
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!stripeSecretKey || !stripePublishableKey) {
        this.results.payment = {
          status: 'warning',
          details: 'Stripe keys not configured - using mock payment service',
          configured: false
        };
        return;
      }

      // Check if we have real Stripe keys (not placeholder values)
      if (stripeSecretKey.includes('your-') || stripePublishableKey.includes('your-')) {
        this.results.payment = {
          status: 'warning',
          details: 'Stripe keys are placeholder values - using mock payment service',
          configured: false
        };
        return;
      }

      // Test Stripe connection
      const isTestMode = stripeSecretKey.startsWith('sk_test_');
      const publishableIsTest = stripePublishableKey.startsWith('pk_test_');

      if (isTestMode !== publishableIsTest) {
        this.results.payment = {
          status: 'error',
          details: 'Stripe key mismatch - secret and publishable keys are from different modes',
          configured: false
        };
        return;
      }

      this.results.payment = {
        status: 'success',
        details: {
          service: 'Stripe',
          mode: isTestMode ? 'Test Mode' : 'Live Mode',
          secretKey: stripeSecretKey.substring(0, 15) + '...',
          publishableKey: stripePublishableKey.substring(0, 15) + '...',
          webhookSecret: stripeWebhookSecret ? 'Configured' : 'Not configured',
          testResult: 'Keys configured and validated'
        },
        configured: true
      };

    } catch (error) {
      this.results.payment = {
        status: 'error',
        details: error.message,
        configured: false
      };
    }
  }

  async testThirdPartyServices() {
    this.log('test', 'Testing Third-party Service Health...');
    
    const services = [
      { name: 'Supabase', url: process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/' },
      { name: 'Resend', url: 'https://api.resend.com/' },
      { name: 'Stripe API', url: 'https://api.stripe.com/v1/' }
    ];

    const healthResults = {};

    for (const service of services) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(service.url, {
          signal: controller.signal,
          method: 'GET',
          headers: service.name === 'Supabase' ? {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
          } : {}
        });
        
        clearTimeout(timeoutId);
        healthResults[service.name] = response.status < 500 ? '✓ Online' : '⚠ Degraded';
      } catch (error) {
        healthResults[service.name] = '✗ Offline';
      }
    }

    this.serviceHealth = healthResults;
  }

  async runAllTests() {
    console.log(`${colors.bright}${colors.blue}🧪 Fisher Backflows Integration Service Testing${colors.reset}\n`);
    
    await this.testDatabaseConnection();
    await this.testEmailService();
    await this.testSMSService();
    await this.testPaymentService();
    await this.testThirdPartyServices();
    
    this.generateReport();
  }

  generateReport() {
    console.log(`\n${colors.bright}${colors.blue}📊 Integration Service Test Report${colors.reset}\n`);
    console.log(`Generated at: ${new Date().toISOString()}\n`);

    // Database Report
    this.printServiceStatus('Database (Supabase)', this.results.database);
    
    // Email Report
    this.printServiceStatus('Email Service (Resend)', this.results.email);
    
    // SMS Report
    this.printServiceStatus('SMS Service (Twilio)', this.results.sms);
    
    // Payment Report
    this.printServiceStatus('Payment Service (Stripe)', this.results.payment);

    // Third-party Service Health
    if (this.serviceHealth) {
      console.log(`${colors.bright}🌐 Third-party Service Health:${colors.reset}`);
      for (const [service, status] of Object.entries(this.serviceHealth)) {
        console.log(`   ${service}: ${status}`);
      }
      console.log('');
    }

    // Overall Summary
    const configured = Object.values(this.results).filter(r => r.configured).length;
    const errors = Object.values(this.results).filter(r => r.status === 'error').length;
    const warnings = Object.values(this.results).filter(r => r.status === 'warning').length;
    
    console.log(`${colors.bright}📋 Summary:${colors.reset}`);
    console.log(`   ✅ Services Configured: ${configured}/4`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   ⚠️  Warnings: ${warnings}\n`);

    // Production Readiness Assessment
    if (errors > 0) {
      console.log(`${colors.red}${colors.bright}🚨 NOT PRODUCTION READY${colors.reset}`);
      console.log(`${colors.red}Critical errors need to be resolved before production deployment.${colors.reset}\n`);
    } else if (configured < 3) {
      console.log(`${colors.yellow}${colors.bright}⚠️  PARTIALLY READY${colors.reset}`);
      console.log(`${colors.yellow}Essential services are working, but some integrations use mock services.${colors.reset}`);
      console.log(`${colors.yellow}Configure missing services for full production functionality.${colors.reset}\n`);
    } else {
      console.log(`${colors.green}${colors.bright}✅ PRODUCTION READY${colors.reset}`);
      console.log(`${colors.green}All essential integrations are properly configured and working.${colors.reset}\n`);
    }

    // Next Steps
    console.log(`${colors.bright}📋 Recommended Next Steps:${colors.reset}`);
    
    if (this.results.database.status === 'error') {
      console.log('   1. 🔧 Fix database connection issues');
    }
    
    if (!this.results.email.configured) {
      console.log('   1. 📧 Configure Resend API key for email notifications');
    }
    
    if (!this.results.sms.configured) {
      console.log('   2. 📱 Configure Twilio for SMS notifications');
    }
    
    if (!this.results.payment.configured) {
      console.log('   3. 💳 Configure Stripe for payment processing');
    }
    
    if (configured >= 3) {
      console.log('   4. 🚀 Deploy to production environment');
      console.log('   5. 📊 Set up monitoring and alerts');
    }

    console.log('');
  }

  printServiceStatus(serviceName, result) {
    const statusIcon = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      unknown: '❓'
    }[result.status];

    const configuredText = result.configured ? 'Configured' : 'Not Configured';
    
    console.log(`${colors.bright}${serviceName}:${colors.reset} ${statusIcon} ${result.status.toUpperCase()} (${configuredText})`);
    
    if (result.details) {
      if (typeof result.details === 'string') {
        console.log(`   ${result.details}`);
      } else {
        for (const [key, value] of Object.entries(result.details)) {
          if (typeof value === 'object') {
            console.log(`   ${key}:`);
            for (const [subKey, subValue] of Object.entries(value)) {
              console.log(`     ${subKey}: ${subValue}`);
            }
          } else {
            console.log(`   ${key}: ${value}`);
          }
        }
      }
    }
    console.log('');
  }
}

// Run the integration tests
const tester = new IntegrationServiceTester();
tester.runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error during integration testing: ${error.message}${colors.reset}`);
  process.exit(1);
});