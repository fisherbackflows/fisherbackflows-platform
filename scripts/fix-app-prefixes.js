#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const FIXES = [
  // Portal pages
  { file: 'src/app/portal/payment-success/page.tsx', old: '/app/dashboard', new: '/portal/dashboard' },
  { file: 'src/app/portal/register/page.tsx', old: '/portal/thank-you', new: '/portal/registration-success' },
  { file: 'src/app/portal/registration-success/page.tsx', old: '/app/dashboard', new: '/portal/dashboard' },
  { file: 'src/app/portal/verification-error/page.tsx', old: '/app/register', new: '/portal/register' },
  { file: 'src/app/portal/verification-success/page.tsx', old: '/app/login', new: '/portal/login' },
  { file: 'src/app/portal/verify-email/page.tsx', old: '/app/dashboard', new: '/portal/dashboard' },
  
  // Team portal pages
  { file: 'src/app/team-portal/backup/page.tsx', old: '/app/backup/download', new: '/team-portal/export' },
  { file: 'src/app/team-portal/backup/page.tsx', old: '/app/backup/restore', new: '/team-portal/import' },
  { file: 'src/app/team-portal/billing/subscriptions/page.tsx', old: '/app/billing', new: '/team-portal/billing/subscriptions' },
  { file: 'src/app/team-portal/billing/subscriptions/page.tsx', old: '/app/billing/history', new: '/team-portal/invoices' },
  { file: 'src/app/team-portal/customers/[id]/page.tsx', old: '/app/customers/', new: '/team-portal/customers/' },
  { file: 'src/app/team-portal/customers/database/page.tsx', old: '/app/customers/import', new: '/team-portal/customers/import' },
  { file: 'src/app/team-portal/customers/database/page.tsx', old: '/app/customers/export', new: '/team-portal/export' },
  { file: 'src/app/team-portal/dashboard/page.tsx', old: '/app/insights', new: '/team-portal/dashboard' },
  { file: 'src/app/team-portal/dashboard/page.tsx', old: '/app/revenue', new: '/team-portal/dashboard' },
  { file: 'src/app/team-portal/dashboard/page.tsx', old: '/app/growth', new: '/team-portal/dashboard' },
  { file: 'src/app/team-portal/district-reports/page.tsx', old: '/app/district-reports/', new: '/team-portal/district-reports' },
  { file: 'src/app/team-portal/invoices/[id]/page.tsx', old: '/app/invoices', new: '/team-portal/invoices' },
  { file: 'src/app/team-portal/reminders/page.tsx', old: '/app/reminders/new', new: '/team-portal/reminders/new' },
];

async function fixAppPrefixes() {
  console.log('🔧 Fixing incorrect /app/* prefixes...\n');
  
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const fix of FIXES) {
    try {
      const filePath = path.join(process.cwd(), fix.file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (content.includes(fix.old)) {
        const newContent = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
        await fs.writeFile(filePath, newContent);
        console.log(`✅ Fixed: ${fix.file}`);
        console.log(`   ${fix.old} → ${fix.new}`);
        fixedCount++;
      } else {
        console.log(`⏭️  Skipped: ${fix.file} (pattern not found)`);
      }
    } catch (error) {
      console.log(`❌ Error: ${fix.file} - ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Errors: ${errorCount} files`);
  console.log(`   Total: ${FIXES.length} patterns`);
}

fixAppPrefixes().catch(console.error);