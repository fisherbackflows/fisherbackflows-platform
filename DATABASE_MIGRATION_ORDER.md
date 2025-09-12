# Database Migration Execution Order

## ⚠️ CRITICAL: Execute These SQL Files in EXACT Order

After analyzing all migration files, here's the conflict-free execution order. **DO NOT skip steps or change order**.

---

## 📋 MIGRATION FILES TO EXECUTE (5 Files Total)

### 1️⃣ **CORE BUSINESS SCHEMA** (REQUIRED)
**File:** `/supabase/migrations/001_consolidated_schema.sql`
**Creates:** All core business tables (customers, devices, appointments, test_reports, invoices, etc.)
**Size:** Large file with complete schema
**Notes:** This is your foundation - everything else depends on this

```sql
-- This file creates:
- organizations table (multi-tenant base)
- customers, devices, appointments, test_reports
- invoices, payments, billing tables
- Basic RLS policies and indexes
```

### 2️⃣ **MISSING SUPPORT TABLES** (REQUIRED)
**File:** `/supabase/migrations/20250111_fix_missing_tables.sql`
**Creates:** Supporting tables that reference core schema
**Size:** Medium file
**Notes:** Must run AFTER core schema since it references those tables

```sql
-- This file creates:
- team_users table (internal users)
- notification_templates
- push_subscriptions
- notification_logs
- email_verifications
```

### 3️⃣ **API SYSTEM SETUP** (REQUIRED for Backflow Buddy API)
**File:** `/supabase/migrations/20250111_api_system_setup_modified.sql`
**Creates:** Complete API infrastructure
**Size:** Large file
**Notes:** Essential for API authentication and webhooks

```sql
-- This file creates:
- companies table (for API tenants)
- api_keys table
- api_usage_logs table
- webhook_endpoints table
- webhook_deliveries table
- API helper functions (generate_api_key, hash_api_key, etc.)
```

### 4️⃣ **SECURITY HARDENING** (REQUIRED)
**File:** `/supabase/migrations/20250111_bulletproof_security_fixed.sql`
**Creates:** Comprehensive RLS policies and security functions
**Size:** Very large file
**Notes:** Critical for data isolation and security

```sql
-- This file creates:
- Enhanced RLS policies for all tables
- Security helper functions
- Audit trigger functions
- Data isolation policies
```

### 5️⃣ **RLS POLICY FIXES** (REQUIRED)
**File:** `/supabase/migrations/20250111_fix_rls_policies.sql`
**Creates:** Additional RLS policies and fixes
**Size:** Small file
**Notes:** Final security layer

```sql
-- This file:
- Fixes any missing RLS policies
- Adds service role permissions
- Ensures complete coverage
```

---

## ❌ FILES TO SKIP (DO NOT EXECUTE)

These files contain duplicate/conflicting schemas:
- `001_initial_schema.sql` - Conflicts with consolidated schema
- `002_complete_business_schema.sql` - Duplicate tables
- `003_missing_business_tables.sql` - Partial duplicates
- `004_complete_business_schema.sql` - Complete duplicate
- `20250111_api_system_setup.sql` - Use _modified version instead
- `20250111_bulletproof_security.sql` - Use _fixed version instead
- `20250111_multi_tenant_setup.sql` - Skip unless you need full multi-tenant

---

## 🚀 EXECUTION STEPS

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new
2. Login with your credentials

### Step 2: Execute Each File in Order
For each file listed above:
1. Open the file in your code editor
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL editor
4. Click "Run" and wait for completion
5. Check for any errors before proceeding

### Step 3: Verify After Each Migration
After EACH file, run this verification:
```sql
-- After file 1: Check core tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('organizations', 'customers', 'devices', 'appointments');

-- After file 2: Check support tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('team_users', 'notification_templates');

-- After file 3: Check API tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('companies', 'api_keys', 'webhook_endpoints');

-- After file 4 & 5: Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## ⚠️ IMPORTANT WARNINGS

### Foreign Key Dependencies
The order is CRITICAL because:
- File 2 references tables from File 1
- File 3 can reference tables from Files 1 & 2
- Files 4 & 5 add policies to existing tables

### If You Get Errors

**"Relation already exists"** errors:
- You may have partially executed migrations
- Run this to check what exists:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**"Column already exists"** errors:
- A previous migration partially completed
- May need to DROP and recreate tables

**"Permission denied"** errors:
- Make sure you're using the Supabase Dashboard
- Don't use external tools that might lack permissions

---

## ✅ SUCCESS VERIFICATION

After all 5 migrations, you should have:

1. **Core Business Tables** (from file 1):
   - customers, devices, appointments, test_reports, invoices, payments

2. **Support Tables** (from file 2):
   - team_users, notification_templates, push_subscriptions

3. **API Tables** (from file 3):
   - companies, api_keys, api_usage_logs, webhook_endpoints

4. **Security** (from files 4 & 5):
   - RLS enabled on all tables
   - Proper policies for data isolation

### Final Verification Query:
```sql
-- Should return ~25-30 tables
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return ~20+ tables with RLS
SELECT COUNT(*) as rls_enabled_tables 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Test API key generation
SELECT generate_api_key() as test_api_key;
-- Should return a key starting with 'bbapi_'
```

---

## 📞 HELP & TROUBLESHOOTING

If you encounter issues:
1. Take a screenshot of the error
2. Note which file number failed
3. Run the verification queries to see current state
4. Check Supabase logs: Dashboard → Logs → Database

**Estimated Time:** 5-10 minutes total (1-2 minutes per file)
**Complexity:** Medium (copy-paste operation, but order matters)

---

**Last Updated:** January 11, 2025
**Total Files to Execute:** 5
**Files to Skip:** 7