#!/usr/bin/env node
/**
 * Complete Integration Test and Setup Script
 * Tests all system components and ensures everything works together
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ANSI color codes for console output
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

class IntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    
    this.supabase = null;
    this.config = {};
    
    // Load environment variables
    this.loadEnvironment();
  }

  // ====================
  // SETUP AND CONFIGURATION
  // ====================

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
      this.log('warn', 'Could not load .env.local file');
    }

    // Validate required environment variables
    this.config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      gmailUser: process.env.GMAIL_USER,
      gmailPassword: process.env.GMAIL_APP_PASSWORD,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      jwtSecret: process.env.JWT_SECRET,
      companyEmail: process.env.COMPANY_EMAIL
    };
  }

  // ====================
  // LOGGING AND OUTPUT
  // ====================

  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    let colorCode = colors.reset;
    let icon = '';

    switch (level) {
      case 'success':
        colorCode = colors.green;
        icon = '✅';
        break;
      case 'error':
        colorCode = colors.red;
        icon = '❌';
        break;
      case 'warn':
        colorCode = colors.yellow;
        icon = '⚠️';
        break;
      case 'info':
        colorCode = colors.blue;
        icon = 'ℹ️';
        break;
      case 'test':
        colorCode = colors.cyan;
        icon = '🔍';
        break;
    }

    console.log(`${colorCode}${icon} ${message}${colors.reset}`);
    
    if (details) {
      console.log(`   ${colors.bright}Details:${colors.reset} ${details}`);
    }
  }

  async test(name, testFn, required = true) {
    this.log('test', `Testing ${name}...`);
    
    try {
      const result = await testFn();
      
      if (result === true || (result && result.success !== false)) {
        this.log('success', `✓ ${name} passed`);
        this.results.passed++;
        this.results.tests.push({ name, status: 'passed', details: result });
      } else {
        const message = result?.message || 'Test failed';
        if (required) {
          this.log('error', `✗ ${name} failed: ${message}`);
          this.results.failed++;
          this.results.tests.push({ name, status: 'failed', details: message });
        } else {
          this.log('warn', `⚠ ${name} warning: ${message}`);
          this.results.warnings++;
          this.results.tests.push({ name, status: 'warning', details: message });
        }
      }
    } catch (error) {
      const message = error.message || 'Unknown error';
      if (required) {
        this.log('error', `✗ ${name} failed: ${message}`);
        this.results.failed++;
        this.results.tests.push({ name, status: 'failed', details: message });
      } else {
        this.log('warn', `⚠ ${name} warning: ${message}`);
        this.results.warnings++;
        this.results.tests.push({ name, status: 'warning', details: message });
      }
    }
    
    console.log(''); // Add spacing between tests
  }

  // ====================
  // INDIVIDUAL TESTS
  // ====================

  async testEnvironmentConfiguration() {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET'
    ];

    const optionalVars = [
      'GMAIL_USER',
      'GMAIL_APP_PASSWORD',
      'STRIPE_SECRET_KEY',
      'TWILIO_ACCOUNT_SID',
      'COMPANY_EMAIL'
    ];

    let missingRequired = [];
    let missingOptional = [];

    for (const varName of requiredVars) {
      if (!process.env[varName] || process.env[varName].includes('your-')) {
        missingRequired.push(varName);
      }
    }

    for (const varName of optionalVars) {
      if (!process.env[varName] || process.env[varName].includes('your-')) {
        missingOptional.push(varName);
      }
    }

    if (missingRequired.length > 0) {
      return {
        success: false,
        message: `Missing required environment variables: ${missingRequired.join(', ')}`
      };
    }

    if (missingOptional.length > 0) {
      return {
        success: true,
        message: `Optional services not configured: ${missingOptional.join(', ')} (will use mock mode)`
      };
    }

    return { success: true, message: 'All environment variables configured' };
  }

  async testDatabaseConnection() {
    if (!this.config.supabaseUrl || !this.config.supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.supabase = createClient(
      this.config.supabaseUrl,
      this.config.supabaseServiceKey
    );

    // Test basic connectivity
    const { data, error } = await this.supabase
      .from('customers')
      .select('id')
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    return { success: true, message: 'Database connected successfully' };
  }

  async testDatabaseSchema() {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    // Check for required tables
    const requiredTables = [
      'customers', 'devices', 'test_reports', 'invoices', 
      'appointments', 'profiles', 'payments', 'email_logs',
      'sms_logs', 'push_subscriptions', 'notification_logs',
      'system_logs'
    ];

    const tableChecks = [];

    for (const table of requiredTables) {
      try {
        const { error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          tableChecks.push(`${table}: ${error.message}`);
        } else {
          tableChecks.push(`${table}: ✓`);
        }
      } catch (error) {
        tableChecks.push(`${table}: ERROR - ${error.message}`);
      }
    }

    const failedTables = tableChecks.filter(check => !check.includes('✓'));
    
    if (failedTables.length > 0) {
      return {
        success: false,
        message: `Missing or invalid tables: ${failedTables.join(', ')}`
      };
    }

    return { 
      success: true, 
      message: `All ${requiredTables.length} required tables found` 
    };
  }

  async testSampleData() {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    // Check if sample data exists
    const { data: customers, error } = await this.supabase
      .from('customers')
      .select('*')
      .limit(5);

    if (error) {
      throw new Error(`Failed to query customers: ${error.message}`);
    }

    const sampleDataExists = customers && customers.length > 0;
    
    return {
      success: true,
      message: sampleDataExists 
        ? `Found ${customers.length} sample customer(s)` 
        : 'No sample data found (this is okay for a fresh installation)'
    };
  }

  async testAPIRoutes() {
    const testRoutes = [
      '/api/health',
      '/api/customers',
      '/api/appointments'
    ];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
    const results = [];

    for (const route of testRoutes) {
      try {
        const url = `${baseUrl}${route}`;
        const response = await this.makeHttpRequest(url);
        
        if (response.statusCode === 200 || response.statusCode === 401) {
          results.push(`${route}: ✓ (${response.statusCode})`);
        } else {
          results.push(`${route}: ✗ (${response.statusCode})`);
        }
      } catch (error) {
        results.push(`${route}: ERROR - ${error.message}`);
      }
    }

    const failedRoutes = results.filter(result => result.includes('✗') || result.includes('ERROR'));
    
    if (failedRoutes.length > 0) {
      return {
        success: false,
        message: `Some API routes failed: ${failedRoutes.join(', ')}`
      };
    }

    return {
      success: true,
      message: `All ${testRoutes.length} API routes accessible`
    };
  }

  async testEmailConfiguration() {
    const emailConfigured = !!(this.config.gmailUser && this.config.gmailPassword);
    
    if (!emailConfigured) {
      return {
        success: false,
        message: 'Email not configured - notifications will use mock mode'
      };
    }

    // Basic validation of email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.config.gmailUser)) {
      return {
        success: false,
        message: 'Invalid email format in GMAIL_USER'
      };
    }

    return {
      success: true,
      message: `Email configured for ${this.config.gmailUser}`
    };
  }

  async testPaymentConfiguration() {
    const stripeConfigured = !!this.config.stripeSecretKey;
    
    if (!stripeConfigured) {
      return {
        success: false,
        message: 'Stripe not configured - payments will use mock mode'
      };
    }

    // Basic validation of Stripe key format
    if (!this.config.stripeSecretKey.startsWith('sk_')) {
      return {
        success: false,
        message: 'Invalid Stripe secret key format'
      };
    }

    return {
      success: true,
      message: 'Stripe payment processing configured'
    };
  }

  async testSMSConfiguration() {
    const twilioConfigured = !!this.config.twilioAccountSid;
    
    if (!twilioConfigured) {
      return {
        success: false,
        message: 'Twilio not configured - SMS will use mock mode'
      };
    }

    return {
      success: true,
      message: 'Twilio SMS configured'
    };
  }

  async testFileSystem() {
    // Test write access to required directories
    const testDirs = [
      'tmp',
      'public/uploads'
    ];

    for (const dir of testDirs) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Test write access
        const testFile = path.join(dirPath, 'test-write.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        throw new Error(`Cannot write to ${dir} directory: ${error.message}`);
      }
    }

    return { success: true, message: 'File system access verified' };
  }

  async testSecurity() {
    // Test JWT secret strength
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return {
        success: false,
        message: 'JWT_SECRET should be at least 32 characters long'
      };
    }

    // Check for default passwords
    const insecureDefaults = [];
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-')) {
      insecureDefaults.push('SUPABASE_SERVICE_ROLE_KEY');
    }

    if (insecureDefaults.length > 0) {
      return {
        success: false,
        message: `Insecure default values found in: ${insecureDefaults.join(', ')}`
      };
    }

    return { success: true, message: 'Security configuration validated' };
  }

  // ====================
  // UTILITY METHODS
  // ====================

  makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            data: data
          });
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // ====================
  // MAIN TEST RUNNER
  // ====================

  async runAllTests() {
    console.log(`${colors.bright}${colors.blue}🚀 Fisher Backflows Platform Integration Test${colors.reset}\n`);
    
    // Environment and Configuration Tests
    await this.test('Environment Configuration', () => this.testEnvironmentConfiguration());
    await this.test('File System Access', () => this.testFileSystem());
    await this.test('Security Configuration', () => this.testSecurity());
    
    // Database Tests
    await this.test('Database Connection', () => this.testDatabaseConnection());
    await this.test('Database Schema', () => this.testDatabaseSchema());
    await this.test('Sample Data', () => this.testSampleData(), false);
    
    // API Tests
    await this.test('API Routes', () => this.testAPIRoutes(), false);
    
    // Service Configuration Tests
    await this.test('Email Configuration', () => this.testEmailConfiguration(), false);
    await this.test('Payment Configuration', () => this.testPaymentConfiguration(), false);
    await this.test('SMS Configuration', () => this.testSMSConfiguration(), false);

    // Print final results
    this.printSummary();
  }

  printSummary() {
    console.log(`${colors.bright}${colors.blue}📊 Test Summary${colors.reset}\n`);
    
    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.results.warnings}${colors.reset}\n`);

    if (this.results.failed > 0) {
      console.log(`${colors.red}${colors.bright}❌ System has critical issues that need to be resolved:${colors.reset}`);
      
      const failedTests = this.results.tests.filter(t => t.status === 'failed');
      for (const test of failedTests) {
        console.log(`   • ${test.name}: ${test.details}`);
      }
      console.log('');
    }

    if (this.results.warnings > 0) {
      console.log(`${colors.yellow}${colors.bright}⚠️  Optional services not configured (will use mock mode):${colors.reset}`);
      
      const warningTests = this.results.tests.filter(t => t.status === 'warning');
      for (const test of warningTests) {
        console.log(`   • ${test.name}: ${test.details}`);
      }
      console.log('');
    }

    if (this.results.failed === 0) {
      console.log(`${colors.green}${colors.bright}🎉 System Ready!${colors.reset}`);
      console.log(`${colors.green}Your Fisher Backflows Platform is properly configured and ready to use.${colors.reset}\n`);
      
      console.log(`${colors.bright}Next steps:${colors.reset}`);
      console.log(`   1. ${colors.cyan}npm run dev${colors.reset} - Start the development server`);
      console.log(`   2. ${colors.cyan}Visit http://localhost:3010${colors.reset} - Access the platform`);
      console.log(`   3. ${colors.cyan}Configure optional services${colors.reset} - Set up email, SMS, payments for full functionality\n`);
    } else {
      console.log(`${colors.red}${colors.bright}🛑 System Not Ready${colors.reset}`);
      console.log(`${colors.red}Please fix the issues above before using the platform.${colors.reset}\n`);
      
      process.exit(1);
    }
  }
}

// Run the integration test
const tester = new IntegrationTester();
tester.runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error during integration test: ${error.message}${colors.reset}`);
  process.exit(1);
});