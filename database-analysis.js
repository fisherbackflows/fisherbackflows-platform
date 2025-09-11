#!/usr/bin/env node

/**
 * Comprehensive Supabase Database Analysis Script
 * Analyzes database structure, relationships, security, and performance
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

class DatabaseAnalyzer {
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env.local');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.results = {};
  }

  async runAnalysis() {
    console.log(`${colors.cyan}${colors.bold}🏗️  COMPREHENSIVE SUPABASE DATABASE ANALYSIS${colors.reset}\n`);
    console.log(`${colors.blue}Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}${colors.reset}\n`);

    try {
      // 1. List all tables with row counts and RLS status
      await this.analyzeTablesAndRowCounts();
      
      // 2. Check schema structure for key tables
      await this.analyzeKeyTableSchemas();
      
      // 3. Review stored procedures, triggers, and functions
      await this.analyzeFunctionsAndTriggers();
      
      // 4. Check database extensions
      await this.analyzeExtensions();
      
      // 5. Review security policies and RLS
      await this.analyzeSecurityPolicies();
      
      // 6. Analyze relationships between tables
      await this.analyzeTableRelationships();
      
      // 7. Check for missing indexes or performance issues
      await this.analyzePerformanceAndIndexes();
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      console.error(`${colors.red}❌ Analysis failed: ${error.message}${colors.reset}`);
    }
  }

  async analyzeTablesAndRowCounts() {
    console.log(`${colors.magenta}${colors.bold}1. TABLES AND ROW COUNTS ANALYSIS${colors.reset}\n`);
    
    try {
      // Get all tables in public schema using SQL
      const { data: tables, error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled,
            obj_description(c.oid) as table_comment
          FROM pg_tables t
          LEFT JOIN pg_class c ON c.relname = t.tablename
          WHERE schemaname = 'public'
          ORDER BY tablename;
        `
      });

      if (error) {
        // Fallback to information_schema
        console.log(`${colors.yellow}Using fallback method for table analysis...${colors.reset}\n`);
        await this.analyzeTablesWithFallback();
        return;
      }

      this.results.tables = [];
      
      console.log(`${colors.blue}📊 Tables Overview:${colors.reset}`);
      console.log(`${'Table Name'.padEnd(35)} ${'Rows'.padEnd(8)} ${'RLS'.padEnd(6)} Comment`);
      console.log('─'.repeat(80));

      for (const table of tables || []) {
        try {
          // Get row count for each table
          const { count, error: countError } = await this.supabase
            .from(table.tablename)
            .select('*', { count: 'exact', head: true });

          const rowCount = countError ? 'Error' : (count || 0).toString();
          const rlsStatus = table.rls_enabled ? '✓' : '✗';
          const comment = table.table_comment || '';

          console.log(`${table.tablename.padEnd(35)} ${rowCount.padEnd(8)} ${rlsStatus.padEnd(6)} ${comment}`);
          
          this.results.tables.push({
            name: table.tablename,
            rowCount: countError ? null : count,
            rlsEnabled: table.rls_enabled,
            comment: comment,
            error: countError?.message
          });
        } catch (err) {
          console.log(`${table.tablename.padEnd(35)} ${'Error'.padEnd(8)} ${'?'.padEnd(6)} ${err.message}`);
          this.results.tables.push({
            name: table.tablename,
            rowCount: null,
            rlsEnabled: table.rls_enabled,
            error: err.message
          });
        }
      }
    } catch (error) {
      console.log(`${colors.red}❌ Failed to analyze tables: ${error.message}${colors.reset}`);
      await this.analyzeTablesWithFallback();
    }
    
    console.log('\n');
  }

  async analyzeTablesWithFallback() {
    console.log(`${colors.blue}📊 Tables Overview (Fallback Method):${colors.reset}`);
    
    // Known tables from the project documentation
    const knownTables = [
      'customers', 'team_users', 'devices', 'appointments', 'test_reports', 'invoices',
      'invoice_line_items', 'payments', 'billing_subscriptions', 'billing_invoices',
      'water_districts', 'water_department_submissions', 'notification_templates',
      'push_subscriptions', 'notification_logs', 'notification_interactions',
      'audit_logs', 'security_logs', 'email_verifications', 'leads',
      'technician_locations', 'technician_current_location', 'time_off_requests',
      'tester_schedules', 'team_sessions'
    ];

    this.results.tables = [];
    
    console.log(`${'Table Name'.padEnd(35)} ${'Rows'.padEnd(8)} Status`);
    console.log('─'.repeat(60));

    for (const tableName of knownTables) {
      try {
        const { count, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`${tableName.padEnd(35)} ${'N/A'.padEnd(8)} Not Found`);
          } else {
            console.log(`${tableName.padEnd(35)} ${'Error'.padEnd(8)} ${error.message.substring(0, 30)}`);
          }
          this.results.tables.push({
            name: tableName,
            rowCount: null,
            error: error.message
          });
        } else {
          console.log(`${tableName.padEnd(35)} ${(count || 0).toString().padEnd(8)} ✓ Found`);
          this.results.tables.push({
            name: tableName,
            rowCount: count || 0
          });
        }
      } catch (err) {
        console.log(`${tableName.padEnd(35)} ${'Error'.padEnd(8)} ${err.message.substring(0, 30)}`);
        this.results.tables.push({
          name: tableName,
          rowCount: null,
          error: err.message
        });
      }
    }
  }

  async analyzeKeyTableSchemas() {
    console.log(`${colors.magenta}${colors.bold}2. KEY TABLE SCHEMAS ANALYSIS${colors.reset}\n`);
    
    const keyTables = ['customers', 'team_users', 'devices', 'appointments', 'test_reports', 'invoices'];
    this.results.schemas = {};

    for (const tableName of keyTables) {
      console.log(`${colors.blue}🔍 Schema for ${tableName}:${colors.reset}`);
      
      try {
        // Get table schema using information_schema
        const { data, error } = await this.supabase.rpc('exec_sql', {
          query: `
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default,
              character_maximum_length
            FROM information_schema.columns
            WHERE table_name = '${tableName}' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });

        if (error) {
          console.log(`  ${colors.red}❌ Error: ${error.message}${colors.reset}`);
          continue;
        }

        if (!data || data.length === 0) {
          console.log(`  ${colors.yellow}⚠️  Table not found or no columns${colors.reset}`);
          continue;
        }

        console.log(`  ${'Column'.padEnd(25)} ${'Type'.padEnd(20)} ${'Nullable'.padEnd(10)} Default`);
        console.log(`  ${'─'.repeat(70)}`);
        
        for (const column of data) {
          const nullable = column.is_nullable === 'YES' ? 'YES' : 'NO';
          const defaultVal = column.column_default || '';
          const typeInfo = column.character_maximum_length 
            ? `${column.data_type}(${column.character_maximum_length})`
            : column.data_type;
          
          console.log(`  ${column.column_name.padEnd(25)} ${typeInfo.padEnd(20)} ${nullable.padEnd(10)} ${defaultVal}`);
        }
        
        this.results.schemas[tableName] = data;
        
      } catch (err) {
        console.log(`  ${colors.red}❌ Failed to analyze ${tableName}: ${err.message}${colors.reset}`);
      }
      
      console.log('');
    }
  }

  async analyzeFunctionsAndTriggers() {
    console.log(`${colors.magenta}${colors.bold}3. FUNCTIONS, TRIGGERS, AND PROCEDURES ANALYSIS${colors.reset}\n`);
    
    try {
      // Get functions and procedures
      console.log(`${colors.blue}🔧 Database Functions:${colors.reset}`);
      const { data: functions, error: funcError } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT 
            proname as function_name,
            pg_get_function_result(oid) as return_type,
            pg_get_function_arguments(oid) as arguments,
            prosrc as source_code
          FROM pg_proc
          WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          ORDER BY proname;
        `
      });

      if (funcError) {
        console.log(`  ${colors.red}❌ Error fetching functions: ${funcError.message}${colors.reset}`);
      } else if (functions && functions.length > 0) {
        for (const func of functions) {
          console.log(`  ${colors.green}✓ ${func.function_name}${colors.reset}`);
          console.log(`    Returns: ${func.return_type}`);
          console.log(`    Arguments: ${func.arguments || 'None'}`);
          console.log('');
        }
        this.results.functions = functions;
      } else {
        console.log(`  ${colors.yellow}⚠️  No custom functions found${colors.reset}`);
      }

      // Get triggers
      console.log(`${colors.blue}⚡ Database Triggers:${colors.reset}`);
      const { data: triggers, error: trigError } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT 
            trigger_name,
            event_manipulation,
            event_object_table,
            action_statement,
            action_timing
          FROM information_schema.triggers
          WHERE trigger_schema = 'public'
          ORDER BY event_object_table, trigger_name;
        `
      });

      if (trigError) {
        console.log(`  ${colors.red}❌ Error fetching triggers: ${trigError.message}${colors.reset}`);
      } else if (triggers && triggers.length > 0) {
        for (const trigger of triggers) {
          console.log(`  ${colors.green}✓ ${trigger.trigger_name}${colors.reset}`);
          console.log(`    Table: ${trigger.event_object_table}`);
          console.log(`    Event: ${trigger.event_manipulation} (${trigger.action_timing})`);
          console.log(`    Action: ${trigger.action_statement.substring(0, 100)}...`);
          console.log('');
        }
        this.results.triggers = triggers;
      } else {
        console.log(`  ${colors.yellow}⚠️  No triggers found${colors.reset}`);
      }

    } catch (error) {
      console.log(`  ${colors.red}❌ Analysis failed: ${error.message}${colors.reset}`);
    }
    
    console.log('');
  }

  async analyzeExtensions() {
    console.log(`${colors.magenta}${colors.bold}4. DATABASE EXTENSIONS ANALYSIS${colors.reset}\n`);
    
    try {
      const { data: extensions, error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT 
            extname as extension_name,
            extversion as version,
            nspname as schema_name
          FROM pg_extension e
          LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
          ORDER BY extname;
        `
      });

      if (error) {
        console.log(`${colors.red}❌ Error fetching extensions: ${error.message}${colors.reset}`);
        return;
      }

      console.log(`${colors.blue}🧩 Installed Extensions:${colors.reset}`);
      console.log(`${'Extension'.padEnd(25)} ${'Version'.padEnd(15)} Schema`);
      console.log('─'.repeat(60));

      for (const ext of extensions || []) {
        console.log(`${ext.extension_name.padEnd(25)} ${ext.version.padEnd(15)} ${ext.schema_name}`);
      }

      this.results.extensions = extensions;
      
    } catch (error) {
      console.log(`${colors.red}❌ Failed to analyze extensions: ${error.message}${colors.reset}`);
    }
    
    console.log('\n');
  }

  async analyzeSecurityPolicies() {
    console.log(`${colors.magenta}${colors.bold}5. SECURITY POLICIES AND RLS ANALYSIS${colors.reset}\n`);
    
    try {
      // Get RLS status for all tables
      console.log(`${colors.blue}🔒 Row Level Security (RLS) Status:${colors.reset}`);
      const { data: rlsTables, error: rlsError } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled,
            (SELECT COUNT(*) FROM pg_policy WHERE polrelid = c.oid) as policy_count
          FROM pg_tables t
          LEFT JOIN pg_class c ON c.relname = t.tablename
          WHERE schemaname = 'public'
          ORDER BY tablename;
        `
      });

      if (!rlsError && rlsTables) {
        console.log(`${'Table'.padEnd(30)} ${'RLS'.padEnd(8)} Policies`);
        console.log('─'.repeat(50));
        
        for (const table of rlsTables) {
          const rlsStatus = table.rls_enabled ? '✓ ON' : '✗ OFF';
          console.log(`${table.tablename.padEnd(30)} ${rlsStatus.padEnd(8)} ${table.policy_count}`);
        }
      }

      // Get specific policies
      console.log(`\n${colors.blue}📋 Security Policies:${colors.reset}`);
      const { data: policies, error: polError } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname;
        `
      });

      if (!polError && policies && policies.length > 0) {
        for (const policy of policies) {
          console.log(`  ${colors.green}✓ ${policy.tablename}.${policy.policyname}${colors.reset}`);
          console.log(`    Command: ${policy.cmd || 'ALL'}`);
          console.log(`    Roles: ${policy.roles || 'public'}`);
          console.log(`    Type: ${policy.permissive}`);
          if (policy.qual) {
            console.log(`    Condition: ${policy.qual.substring(0, 100)}...`);
          }
          console.log('');
        }
        this.results.policies = policies;
      } else {
        console.log(`  ${colors.yellow}⚠️  No RLS policies found${colors.reset}`);
      }

    } catch (error) {
      console.log(`${colors.red}❌ Security analysis failed: ${error.message}${colors.reset}`);
    }
    
    console.log('');
  }

  async analyzeTableRelationships() {
    console.log(`${colors.magenta}${colors.bold}6. TABLE RELATIONSHIPS ANALYSIS${colors.reset}\n`);
    
    try {
      console.log(`${colors.blue}🔗 Foreign Key Relationships:${colors.reset}`);
      const { data: relationships, error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT 
            tc.table_name as source_table,
            kcu.column_name as source_column,
            ccu.table_name as target_table,
            ccu.column_name as target_column,
            tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          ORDER BY tc.table_name, tc.constraint_name;
        `
      });

      if (error) {
        console.log(`${colors.red}❌ Error analyzing relationships: ${error.message}${colors.reset}`);
        return;
      }

      if (relationships && relationships.length > 0) {
        console.log(`${'Source Table'.padEnd(25)} ${'Column'.padEnd(20)} ${'→ Target Table'.padEnd(25)} Column`);
        console.log('─'.repeat(80));
        
        for (const rel of relationships) {
          console.log(`${rel.source_table.padEnd(25)} ${rel.source_column.padEnd(20)} → ${rel.target_table.padEnd(25)} ${rel.target_column}`);
        }
        
        this.results.relationships = relationships;
      } else {
        console.log(`  ${colors.yellow}⚠️  No foreign key relationships found${colors.reset}`);
      }

    } catch (error) {
      console.log(`${colors.red}❌ Relationship analysis failed: ${error.message}${colors.reset}`);
    }
    
    console.log('\n');
  }

  async analyzePerformanceAndIndexes() {
    console.log(`${colors.magenta}${colors.bold}7. PERFORMANCE AND INDEXES ANALYSIS${colors.reset}\n`);
    
    try {
      console.log(`${colors.blue}⚡ Database Indexes:${colors.reset}`);
      const { data: indexes, error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = 'public'
          ORDER BY tablename, indexname;
        `
      });

      if (error) {
        console.log(`${colors.red}❌ Error analyzing indexes: ${error.message}${colors.reset}`);
        return;
      }

      if (indexes && indexes.length > 0) {
        let currentTable = '';
        for (const index of indexes) {
          if (index.tablename !== currentTable) {
            if (currentTable !== '') console.log('');
            console.log(`  ${colors.cyan}Table: ${index.tablename}${colors.reset}`);
            currentTable = index.tablename;
          }
          console.log(`    ${colors.green}✓ ${index.indexname}${colors.reset}`);
          console.log(`      ${index.indexdef}`);
        }
        
        this.results.indexes = indexes;
      } else {
        console.log(`  ${colors.yellow}⚠️  No indexes found${colors.reset}`);
      }

      // Check for potential performance issues
      console.log(`\n${colors.blue}🔍 Performance Recommendations:${colors.reset}`);
      
      // Check for tables without primary keys
      const tablesWithoutPK = this.results.tables?.filter(table => {
        const tableIndexes = indexes?.filter(idx => idx.tablename === table.name);
        return !tableIndexes?.some(idx => idx.indexname.includes('_pkey'));
      });

      if (tablesWithoutPK && tablesWithoutPK.length > 0) {
        console.log(`  ${colors.yellow}⚠️  Tables without primary keys:${colors.reset}`);
        tablesWithoutPK.forEach(table => {
          console.log(`    - ${table.name}`);
        });
      } else {
        console.log(`  ${colors.green}✓ All tables have primary keys${colors.reset}`);
      }

    } catch (error) {
      console.log(`${colors.red}❌ Performance analysis failed: ${error.message}${colors.reset}`);
    }
    
    console.log('\n');
  }

  generateSummary() {
    console.log(`${colors.cyan}${colors.bold}📊 ANALYSIS SUMMARY${colors.reset}\n`);
    
    const totalTables = this.results.tables?.length || 0;
    const tablesWithData = this.results.tables?.filter(t => t.rowCount && t.rowCount > 0).length || 0;
    const tablesWithRLS = this.results.tables?.filter(t => t.rlsEnabled).length || 0;
    const totalExtensions = this.results.extensions?.length || 0;
    const totalFunctions = this.results.functions?.length || 0;
    const totalTriggers = this.results.triggers?.length || 0;
    const totalPolicies = this.results.policies?.length || 0;
    const totalRelationships = this.results.relationships?.length || 0;
    const totalIndexes = this.results.indexes?.length || 0;

    console.log(`${colors.green}✓ Database Connection: Success${colors.reset}`);
    console.log(`${colors.blue}📊 Total Tables: ${totalTables}${colors.reset}`);
    console.log(`${colors.blue}📈 Tables with Data: ${tablesWithData}${colors.reset}`);
    console.log(`${colors.blue}🔒 Tables with RLS: ${tablesWithRLS}${colors.reset}`);
    console.log(`${colors.blue}🧩 Extensions: ${totalExtensions}${colors.reset}`);
    console.log(`${colors.blue}🔧 Functions: ${totalFunctions}${colors.reset}`);
    console.log(`${colors.blue}⚡ Triggers: ${totalTriggers}${colors.reset}`);
    console.log(`${colors.blue}📋 Security Policies: ${totalPolicies}${colors.reset}`);
    console.log(`${colors.blue}🔗 Foreign Keys: ${totalRelationships}${colors.reset}`);
    console.log(`${colors.blue}⚡ Indexes: ${totalIndexes}${colors.reset}`);

    // Recommendations
    console.log(`\n${colors.yellow}${colors.bold}💡 RECOMMENDATIONS:${colors.reset}`);
    
    if (tablesWithRLS < totalTables) {
      console.log(`${colors.yellow}⚠️  Enable RLS on remaining ${totalTables - tablesWithRLS} tables${colors.reset}`);
    }
    
    if (totalPolicies === 0) {
      console.log(`${colors.yellow}⚠️  Add RLS policies to secure table access${colors.reset}`);
    }
    
    if (totalRelationships === 0) {
      console.log(`${colors.yellow}⚠️  Consider adding foreign key constraints for data integrity${colors.reset}`);
    }

    console.log(`\n${colors.cyan}Analysis completed at ${new Date().toISOString()}${colors.reset}`);
  }
}

// Run the analysis
async function main() {
  try {
    const analyzer = new DatabaseAnalyzer();
    await analyzer.runAnalysis();
  } catch (error) {
    console.error(`${colors.red}❌ Analysis failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();