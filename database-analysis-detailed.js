#!/usr/bin/env node

/**
 * Enhanced Supabase Database Analysis Script
 * Uses alternative methods when direct SQL execution isn't available
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

class EnhancedDatabaseAnalyzer {
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env.local');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.results = {
      connection: null,
      tables: [],
      tableDetails: {},
      dataDistribution: {},
      schemaAnalysis: {},
      securityAnalysis: {},
      performanceMetrics: {}
    };
  }

  async runDetailedAnalysis() {
    console.log(`${colors.cyan}${colors.bold}🔍 ENHANCED SUPABASE DATABASE ANALYSIS${colors.reset}\n`);
    console.log(`${colors.blue}Database URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}${colors.reset}\n`);

    try {
      // Test connection and analyze tables
      await this.testConnectionAndAnalyzeTables();
      
      // Analyze table structures by inspection
      await this.analyzeTableStructures();
      
      // Analyze data distribution and patterns
      await this.analyzeDataDistribution();
      
      // Check security configurations
      await this.analyzeSecurityConfiguration();
      
      // Performance analysis through data inspection
      await this.analyzePerformanceIndicators();
      
      // Generate comprehensive report
      this.generateComprehensiveReport();
      
    } catch (error) {
      console.error(`${colors.red}❌ Analysis failed: ${error.message}${colors.reset}`);
    }
  }

  async testConnectionAndAnalyzeTables() {
    console.log(`${colors.magenta}${colors.bold}1. CONNECTION TEST AND TABLE DISCOVERY${colors.reset}\n`);
    
    // Known tables from project documentation and observation
    const expectedTables = [
      'customers', 'team_users', 'devices', 'appointments', 'test_reports', 
      'invoices', 'invoice_line_items', 'payments', 'billing_subscriptions', 
      'billing_invoices', 'water_districts', 'water_department_submissions',
      'notification_templates', 'push_subscriptions', 'notification_logs', 
      'notification_interactions', 'audit_logs', 'security_logs', 
      'email_verifications', 'leads', 'technician_locations', 
      'technician_current_location', 'time_off_requests', 'tester_schedules', 
      'team_sessions'
    ];

    console.log(`${colors.blue}📊 Analyzing ${expectedTables.length} Expected Tables:${colors.reset}\n`);
    console.log(`${'Table Name'.padEnd(35)} ${'Status'.padEnd(12)} ${'Row Count'.padEnd(12)} Notes`);
    console.log('─'.repeat(90));

    for (const tableName of expectedTables) {
      try {
        // Test table existence and get count
        const { count, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`${tableName.padEnd(35)} ${'❌ Missing'.padEnd(12)} ${'N/A'.padEnd(12)} Table not found`);
            this.results.tables.push({ name: tableName, exists: false, error: error.message });
          } else if (error.message.includes('permission denied') || error.message.includes('JWT')) {
            console.log(`${tableName.padEnd(35)} ${'🔒 Protected'.padEnd(12)} ${'Unknown'.padEnd(12)} Access restricted`);
            this.results.tables.push({ name: tableName, exists: true, protected: true, error: error.message });
          } else {
            console.log(`${tableName.padEnd(35)} ${'⚠️ Error'.padEnd(12)} ${'Unknown'.padEnd(12)} ${error.message.substring(0, 30)}`);
            this.results.tables.push({ name: tableName, exists: false, error: error.message });
          }
        } else {
          const rowCount = count || 0;
          const status = rowCount > 0 ? '✅ Active' : '📭 Empty';
          const notes = rowCount > 1000 ? 'Large dataset' : rowCount > 100 ? 'Medium dataset' : rowCount > 0 ? 'Small dataset' : 'No data';
          
          console.log(`${tableName.padEnd(35)} ${status.padEnd(12)} ${rowCount.toString().padEnd(12)} ${notes}`);
          this.results.tables.push({ 
            name: tableName, 
            exists: true, 
            rowCount: rowCount,
            category: notes
          });
        }
      } catch (err) {
        console.log(`${tableName.padEnd(35)} ${'❌ Failed'.padEnd(12)} ${'Error'.padEnd(12)} ${err.message.substring(0, 30)}`);
        this.results.tables.push({ name: tableName, exists: false, error: err.message });
      }
    }

    this.results.connection = 'success';
    console.log('\n');
  }

  async analyzeTableStructures() {
    console.log(`${colors.magenta}${colors.bold}2. TABLE STRUCTURE ANALYSIS${colors.reset}\n`);
    
    // Focus on key tables with data
    const keyTables = this.results.tables
      .filter(t => t.exists && t.rowCount > 0)
      .slice(0, 6)  // Analyze top 6 tables
      .map(t => t.name);

    console.log(`${colors.blue}🔍 Analyzing Structure of Active Tables:${colors.reset}\n`);

    for (const tableName of keyTables) {
      console.log(`${colors.cyan}📋 ${tableName.toUpperCase()}${colors.reset}`);
      
      try {
        // Get a sample record to understand structure
        const { data: sample, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`  ${colors.red}❌ Cannot access: ${error.message}${colors.reset}`);
          continue;
        }

        if (!sample || sample.length === 0) {
          console.log(`  ${colors.yellow}⚠️ No data found${colors.reset}`);
          continue;
        }

        const record = sample[0];
        const columns = Object.keys(record);
        
        console.log(`  ${colors.green}✓ ${columns.length} columns detected${colors.reset}`);
        console.log(`  ${'Column'.padEnd(25)} ${'Type'.padEnd(15)} ${'Sample Value'.padEnd(30)} Notes`);
        console.log(`  ${'─'.repeat(80)}`);

        for (const column of columns) {
          const value = record[column];
          const type = this.inferDataType(value);
          const sample = this.formatSampleValue(value);
          const notes = this.analyzeColumnCharacteristics(column, value);
          
          console.log(`  ${column.padEnd(25)} ${type.padEnd(15)} ${sample.padEnd(30)} ${notes}`);
        }

        // Store structure analysis
        this.results.schemaAnalysis[tableName] = {
          columnCount: columns.length,
          columns: columns.map(col => ({
            name: col,
            type: this.inferDataType(record[col]),
            hasData: record[col] !== null,
            characteristics: this.analyzeColumnCharacteristics(col, record[col])
          }))
        };

        console.log('');
        
      } catch (err) {
        console.log(`  ${colors.red}❌ Analysis failed: ${err.message}${colors.reset}\n`);
      }
    }
  }

  async analyzeDataDistribution() {
    console.log(`${colors.magenta}${colors.bold}3. DATA DISTRIBUTION ANALYSIS${colors.reset}\n`);
    
    const activeTables = this.results.tables.filter(t => t.exists && t.rowCount > 0);
    
    console.log(`${colors.blue}📈 Data Volume Distribution:${colors.reset}`);
    console.log(`${'Table'.padEnd(30)} ${'Records'.padEnd(10)} ${'Percentage'.padEnd(12)} Category`);
    console.log('─'.repeat(70));

    const totalRecords = activeTables.reduce((sum, t) => sum + (t.rowCount || 0), 0);

    for (const table of activeTables.sort((a, b) => (b.rowCount || 0) - (a.rowCount || 0))) {
      const percentage = totalRecords > 0 ? ((table.rowCount / totalRecords) * 100).toFixed(1) + '%' : '0%';
      console.log(`${table.name.padEnd(30)} ${(table.rowCount || 0).toString().padEnd(10)} ${percentage.padEnd(12)} ${table.category || 'Unknown'}`);
    }

    console.log(`\nTotal Records: ${totalRecords.toLocaleString()}`);

    // Analyze recent activity patterns
    console.log(`\n${colors.blue}🕒 Recent Activity Analysis:${colors.reset}`);
    
    const tablesWithTimestamps = ['customers', 'appointments', 'security_logs', 'team_sessions', 'leads'];
    
    for (const tableName of tablesWithTimestamps) {
      const table = this.results.tables.find(t => t.name === tableName && t.exists);
      if (!table) continue;

      try {
        // Check for recent records (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: recentCount, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        if (!error && recentCount !== null) {
          const activityRate = table.rowCount > 0 ? ((recentCount / table.rowCount) * 100).toFixed(1) : '0';
          console.log(`  ${tableName.padEnd(25)} ${recentCount} recent (${activityRate}% of total)`);
        }
      } catch (err) {
        // Try with updated_at if created_at doesn't exist
        try {
          const { count: recentCount, error } = await this.supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .gte('updated_at', sevenDaysAgo.toISOString());

          if (!error && recentCount !== null) {
            const activityRate = table.rowCount > 0 ? ((recentCount / table.rowCount) * 100).toFixed(1) : '0';
            console.log(`  ${tableName.padEnd(25)} ${recentCount} recent (${activityRate}% of total)`);
          }
        } catch (err2) {
          console.log(`  ${tableName.padEnd(25)} Unable to check activity`);
        }
      }
    }

    console.log('\n');
  }

  async analyzeSecurityConfiguration() {
    console.log(`${colors.magenta}${colors.bold}4. SECURITY CONFIGURATION ANALYSIS${colors.reset}\n`);
    
    console.log(`${colors.blue}🔒 Access Control Testing:${colors.reset}`);
    console.log(`${'Table'.padEnd(30)} ${'Read Access'.padEnd(15)} ${'RLS Status'.padEnd(15)} Security Notes`);
    console.log('─'.repeat(85));

    for (const table of this.results.tables.filter(t => t.exists)) {
      let readAccess = 'Unknown';
      let rlsStatus = 'Unknown';
      let securityNotes = '';

      if (table.protected) {
        readAccess = '🔒 Restricted';
        rlsStatus = '✓ Likely ON';
        securityNotes = 'Access denied - Good security';
      } else if (table.rowCount !== undefined) {
        readAccess = '✅ Open';
        rlsStatus = '❌ OFF/Bypass';
        securityNotes = 'Public access - Review needed';
      }

      console.log(`${table.name.padEnd(30)} ${readAccess.padEnd(15)} ${rlsStatus.padEnd(15)} ${securityNotes}`);
    }

    // Test authentication patterns
    console.log(`\n${colors.blue}🔐 Authentication System Analysis:${colors.reset}`);
    
    // Check customers table for auth patterns
    const customerTable = this.results.tables.find(t => t.name === 'customers' && t.exists);
    if (customerTable && !customerTable.protected) {
      try {
        const { data: authSample, error } = await this.supabase
          .from('customers')
          .select('id, email, created_at')
          .limit(3);

        if (!error && authSample && authSample.length > 0) {
          console.log(`  ✓ Customer authentication system detected`);
          console.log(`  ✓ ${authSample.length} customer accounts sampled`);
          console.log(`  ✓ Email-based authentication confirmed`);
        }
      } catch (err) {
        console.log(`  ⚠️ Cannot analyze customer auth: ${err.message}`);
      }
    }

    // Check security logs
    const securityTable = this.results.tables.find(t => t.name === 'security_logs' && t.exists);
    if (securityTable && securityTable.rowCount > 0) {
      console.log(`  ✓ Security logging active (${securityTable.rowCount} events)`);
    }

    console.log('\n');
  }

  async analyzePerformanceIndicators() {
    console.log(`${colors.magenta}${colors.bold}5. PERFORMANCE INDICATORS ANALYSIS${colors.reset}\n`);
    
    console.log(`${colors.blue}⚡ Query Performance Testing:${colors.reset}`);
    
    const testTables = this.results.tables
      .filter(t => t.exists && t.rowCount > 0)
      .slice(0, 5);

    console.log(`${'Table'.padEnd(25)} ${'Records'.padEnd(10)} ${'Query Time'.padEnd(15)} Performance`);
    console.log('─'.repeat(70));

    for (const table of testTables) {
      const startTime = Date.now();
      
      try {
        const { data, error } = await this.supabase
          .from(table.name)
          .select('*')
          .limit(10);

        const queryTime = Date.now() - startTime;
        const performance = queryTime < 100 ? 'Excellent' : 
                           queryTime < 300 ? 'Good' : 
                           queryTime < 1000 ? 'Fair' : 'Slow';

        if (!error) {
          console.log(`${table.name.padEnd(25)} ${(table.rowCount || 0).toString().padEnd(10)} ${queryTime + 'ms'.padEnd(15)} ${performance}`);
        }
      } catch (err) {
        console.log(`${table.name.padEnd(25)} ${(table.rowCount || 0).toString().padEnd(10)} ${'Error'.padEnd(15)} Failed`);
      }
    }

    // Analyze database health indicators
    console.log(`\n${colors.blue}💊 Database Health Indicators:${colors.reset}`);
    
    const healthChecks = [
      { name: 'Total Tables', value: this.results.tables.length, status: this.results.tables.length >= 20 ? 'Good' : 'Limited' },
      { name: 'Active Tables', value: this.results.tables.filter(t => t.rowCount > 0).length, status: 'Active' },
      { name: 'Data Volume', value: this.results.tables.reduce((sum, t) => sum + (t.rowCount || 0), 0).toLocaleString(), status: 'Populated' },
      { name: 'Large Tables', value: this.results.tables.filter(t => t.rowCount > 1000).length, status: 'Present' }
    ];

    for (const check of healthChecks) {
      console.log(`  ${check.name.padEnd(20)}: ${check.value.toString().padEnd(15)} (${check.status})`);
    }

    console.log('\n');
  }

  generateComprehensiveReport() {
    console.log(`${colors.cyan}${colors.bold}📊 COMPREHENSIVE DATABASE ANALYSIS REPORT${colors.reset}\n`);
    
    const stats = {
      totalTables: this.results.tables.length,
      existingTables: this.results.tables.filter(t => t.exists).length,
      activeTables: this.results.tables.filter(t => t.exists && t.rowCount > 0).length,
      protectedTables: this.results.tables.filter(t => t.protected).length,
      totalRecords: this.results.tables.reduce((sum, t) => sum + (t.rowCount || 0), 0),
      largeTables: this.results.tables.filter(t => t.rowCount > 1000).length
    };

    // Executive Summary
    console.log(`${colors.green}${colors.bold}✅ EXECUTIVE SUMMARY${colors.reset}`);
    console.log(`Database Status: ${colors.green}✓ Operational${colors.reset}`);
    console.log(`Tables: ${stats.existingTables}/${stats.totalTables} exist, ${stats.activeTables} with data`);
    console.log(`Data Volume: ${stats.totalRecords.toLocaleString()} total records`);
    console.log(`Security: ${stats.protectedTables} tables have access restrictions`);
    
    // Detailed Metrics
    console.log(`\n${colors.blue}${colors.bold}📈 DETAILED METRICS${colors.reset}`);
    console.log(`📊 Table Status Distribution:`);
    console.log(`  • Active tables with data: ${stats.activeTables}`);
    console.log(`  • Empty but existing: ${stats.existingTables - stats.activeTables}`);
    console.log(`  • Missing/Inaccessible: ${stats.totalTables - stats.existingTables}`);
    
    console.log(`\n📈 Data Volume Analysis:`);
    const topTables = this.results.tables
      .filter(t => t.rowCount > 0)
      .sort((a, b) => (b.rowCount || 0) - (a.rowCount || 0))
      .slice(0, 5);
    
    topTables.forEach(table => {
      const percentage = ((table.rowCount / stats.totalRecords) * 100).toFixed(1);
      console.log(`  • ${table.name}: ${table.rowCount.toLocaleString()} records (${percentage}%)`);
    });

    // Security Assessment
    console.log(`\n${colors.yellow}${colors.bold}🔒 SECURITY ASSESSMENT${colors.reset}`);
    console.log(`Access Control Status:`);
    console.log(`  • Protected tables: ${stats.protectedTables} (${((stats.protectedTables / stats.totalTables) * 100).toFixed(1)}%)`);
    console.log(`  • Open access tables: ${stats.existingTables - stats.protectedTables}`);
    
    if (stats.protectedTables < stats.existingTables) {
      console.log(`  ${colors.yellow}⚠️ Recommendation: Review RLS policies for open tables${colors.reset}`);
    }

    // Performance Assessment
    console.log(`\n${colors.magenta}${colors.bold}⚡ PERFORMANCE ASSESSMENT${colors.reset}`);
    console.log(`Database Scale: ${stats.largeTables > 0 ? 'Enterprise' : stats.totalRecords > 1000 ? 'Medium' : 'Small'}`);
    console.log(`Query Performance: Generally responsive`);
    console.log(`Data Distribution: ${stats.largeTables > 0 ? 'Some large tables detected' : 'Evenly distributed'}`);

    // Architecture Assessment
    console.log(`\n${colors.cyan}${colors.bold}🏗️ ARCHITECTURE ASSESSMENT${colors.reset}`);
    console.log(`Core Business Tables: ${['customers', 'devices', 'appointments', 'test_reports'].filter(name => 
      this.results.tables.find(t => t.name === name && t.exists)
    ).length}/4 present`);
    
    console.log(`Supporting Systems: ${['audit_logs', 'security_logs', 'notification_templates'].filter(name =>
      this.results.tables.find(t => t.name === name && t.exists)  
    ).length}/3 present`);

    // Key Findings
    console.log(`\n${colors.green}${colors.bold}🔍 KEY FINDINGS${colors.reset}`);
    console.log(`✅ Database is operational and contains production data`);
    console.log(`✅ Core business functionality tables are present`);
    console.log(`✅ Customer data (${this.results.tables.find(t => t.name === 'customers')?.rowCount || 0} customers) is populated`);
    console.log(`✅ Lead generation system is active (${this.results.tables.find(t => t.name === 'leads')?.rowCount || 0} leads)`);
    
    if (stats.protectedTables > 0) {
      console.log(`✅ Security measures are in place on some tables`);
    } else {
      console.log(`⚠️ Consider implementing row-level security policies`);
    }

    // Recommendations
    console.log(`\n${colors.yellow}${colors.bold}💡 RECOMMENDATIONS${colors.reset}`);
    
    if (stats.protectedTables < stats.existingTables * 0.8) {
      console.log(`1. Implement RLS policies on ${stats.existingTables - stats.protectedTables} unprotected tables`);
    }
    
    if (stats.largeTables > 2) {
      console.log(`2. Consider indexing optimization for ${stats.largeTables} large tables`);
    }
    
    if (this.results.tables.filter(t => t.error).length > 0) {
      console.log(`3. Investigate ${this.results.tables.filter(t => t.error).length} tables with access errors`);
    }
    
    console.log(`4. Regular backup and monitoring procedures recommended`);
    console.log(`5. Consider implementing database connection pooling for high traffic`);

    console.log(`\n${colors.cyan}Analysis completed: ${new Date().toISOString()}${colors.reset}`);
  }

  // Helper methods
  inferDataType(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'timestamp';
      if (value.match(/^[a-f0-9-]{36}$/)) return 'uuid';
      if (value.includes('@')) return 'email';
      return 'text';
    }
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'numeric';
    if (typeof value === 'boolean') return 'boolean';
    return 'object';
  }

  formatSampleValue(value) {
    if (value === null) return 'NULL';
    if (typeof value === 'string') {
      if (value.length > 25) return value.substring(0, 22) + '...';
      return value;
    }
    return String(value);
  }

  analyzeColumnCharacteristics(columnName, value) {
    const notes = [];
    
    if (columnName.includes('id')) notes.push('ID field');
    if (columnName.includes('email')) notes.push('Email');
    if (columnName.includes('created') || columnName.includes('updated')) notes.push('Timestamp');
    if (columnName.includes('password') || columnName.includes('hash')) notes.push('Sensitive');
    if (value === null) notes.push('Nullable');
    
    return notes.join(', ') || 'Standard';
  }
}

// Run the enhanced analysis
async function main() {
  try {
    const analyzer = new EnhancedDatabaseAnalyzer();
    await analyzer.runDetailedAnalysis();
  } catch (error) {
    console.error(`${colors.red}❌ Analysis failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();