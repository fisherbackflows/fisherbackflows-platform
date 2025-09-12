
# API System Setup Migration - Manual Execution Instructions

Since automated execution via API is not available, please execute this migration manually using the Supabase Dashboard:

## Steps:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx
2. **Navigate to SQL Editor**: Click on "SQL Editor" in the left sidebar
3. **Create New Query**: Click "New Query"
4. **Copy Migration SQL**: Copy the entire content from the file:
   `/mnt/c/users/Fishe/fisherbackflows2/fisherbackflows-platform/supabase/migrations/20250111_api_system_setup_modified.sql`
5. **Paste and Execute**: Paste the SQL into the editor and click "Run"

## Migration Summary:

The migration will create:
- ✅ companies table (for API multi-tenancy support)
- ✅ api_keys table (for API authentication)
- ✅ api_usage_logs table (for tracking API usage)
- ✅ webhook_endpoints table (for webhook configurations)
- ✅ webhook_deliveries table (for webhook delivery logs)
- ✅ api_rate_limits table (for rate limiting)
- ✅ Required indexes for performance
- ✅ RLS policies for security
- ✅ Helper functions for API management

## Expected Output:

After successful execution, you should see messages like:
- CREATE EXTENSION
- CREATE TABLE
- CREATE INDEX
- ALTER TABLE
- CREATE POLICY
- CREATE FUNCTION
- CREATE TRIGGER
- CREATE VIEW
- COMMENT

## Verification:

After execution, verify by running these queries in SQL Editor:
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
    'companies', 'api_keys', 'api_usage_logs', 
    'webhook_endpoints', 'webhook_deliveries', 'api_rate_limits'
);

-- Test functions
SELECT get_current_company_id() as company_id;
SELECT generate_api_key() as sample_key;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE '%api%' OR tablename = 'companies';
```

## Next Steps:

After successful migration, the Backflow Buddy API system will be ready for:
- API key management
- Usage tracking and analytics  
- Webhook integrations
- Rate limiting
- Multi-tenant support (via companies table)
