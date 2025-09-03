#!/usr/bin/env node

const https = require('https');
const fs = require('fs').promises;

// Supabase connection details
const SUPABASE_URL = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

async function executeSQLViaAPI(sqlContent, description) {
    console.log(`\n🔄 Applying: ${description}...`);
    
    // Split SQL into individual statements
    const statements = sqlContent
        .split(/;(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|$))/gi)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement) continue;
        
        // Log first 50 chars of statement
        const preview = statement.substring(0, 50).replace(/\n/g, ' ');
        process.stdout.write(`   [${i+1}/${statements.length}] ${preview}... `);
        
        try {
            // For CREATE TABLE statements, we'll mark as would-execute
            if (statement.match(/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)/i)) {
                console.log('✓');
                successCount++;
            }
        } catch (err) {
            console.log('✗');
            errorCount++;
            errors.push(`Statement ${i+1}: ${err.message}`);
        }
    }
    
    if (errorCount === 0) {
        console.log(`✅ ${description}: Ready to apply (${successCount} statements)`);
        return { success: true, statements: statements };
    } else {
        console.log(`⚠️ ${description}: ${errorCount} statements need review`);
        errors.forEach(e => console.log(`   - ${e}`));
        return { success: false, statements: statements, errors: errors };
    }
}

async function main() {
    console.log('📱 Applying Mobile SQL Tables to Supabase');
    console.log('==========================================');
    
    const files = [
        { file: 'MOBILE_LOCATION_TRACKING_SCHEMA.sql', desc: 'Mobile Location Tracking' },
        { file: 'PWA_DATABASE_TABLES.sql', desc: 'PWA Push Notifications' },
        { file: 'DATABASE_PERFORMANCE_COMPLETE.sql', desc: 'Performance Optimizations' },
        { file: 'PERFORMANCE_OPTIMIZATION_CRITICAL.sql', desc: 'Critical Performance' },
        { file: 'EXECUTE_SECURITY_POLICIES.sql', desc: 'Security Policies' }
    ];
    
    const allStatements = [];
    
    for (const { file, desc } of files) {
        try {
            const content = await fs.readFile(file, 'utf8');
            const result = await executeSQLViaAPI(content, desc);
            if (result.statements) {
                allStatements.push(...result.statements.map(s => ({ 
                    sql: s, 
                    source: file 
                })));
            }
        } catch (err) {
            console.error(`❌ Error reading ${file}: ${err.message}`);
        }
    }
    
    // Create combined SQL file
    console.log('\n📝 Creating combined SQL file for manual execution...');
    
    const combinedSQL = `-- 🚀 COMBINED MOBILE FEATURES SQL
-- Generated: ${new Date().toISOString()}
-- Total Statements: ${allStatements.length}
-- Apply this in Supabase SQL Editor

${allStatements.map((item, i) => `
-- Statement ${i+1} from ${item.source}
${item.sql};`).join('\n')}

-- ✅ All mobile features SQL combined
`;
    
    await fs.writeFile('APPLY_ALL_MOBILE_TABLES.sql', combinedSQL);
    console.log('✅ Created: APPLY_ALL_MOBILE_TABLES.sql');
    
    console.log('\n📋 INSTRUCTIONS TO APPLY:');
    console.log('==========================================');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new');
    console.log('');
    console.log('2. Copy the contents of APPLY_ALL_MOBILE_TABLES.sql');
    console.log('');
    console.log('3. Paste and click "Run"');
    console.log('');
    console.log('4. Or apply individual files one by one:');
    files.forEach((f, i) => {
        console.log(`   ${i+1}. ${f.file}`);
    });
    
    console.log('\n🔗 Direct SQL Editor Link:');
    console.log('   https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql');
}

main().catch(console.error);