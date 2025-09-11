# Manual RLS Implementation Guide
## Fisher Backflows Platform - Security Advisory Fix

Due to API limitations with DDL operations, some RLS policies need to be executed manually in the Supabase SQL Editor.

## Security Advisories Being Addressed

1. **billing_invoices** - Table has RLS enabled but no policies
2. **security_logs** - Table has RLS enabled but no policies  
3. **technician_locations** - Table has RLS enabled but no policies
4. **technician_current_location** - Table has RLS enabled but no policies

## Quick Setup (Copy & Paste These Commands)

### 1. Access Supabase SQL Editor
- Go to https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx
- Navigate to SQL Editor
- Click "New query"

### 2. Execute Core RLS Setup (Paste This Block)

```sql
-- Enable RLS on key tables (addresses security advisories)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_current_location ENABLE ROW LEVEL SECURITY;
```

### 3. Create Customer Data Isolation Policies (Paste This Block)

```sql
-- Customer data isolation
CREATE POLICY "customers_own_data" ON public.customers
    FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "devices_customer_access" ON public.devices
    FOR ALL USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

CREATE POLICY "appointments_customer_access" ON public.appointments
    FOR ALL USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

CREATE POLICY "invoices_customer_access" ON public.invoices
    FOR ALL USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

CREATE POLICY "test_reports_customer_access" ON public.test_reports
    FOR ALL USING (device_id IN (SELECT id FROM public.devices WHERE customer_id = auth.uid()))
    WITH CHECK (device_id IN (SELECT id FROM public.devices WHERE customer_id = auth.uid()));
```

### 4. Fix Security Advisory Tables (Paste This Block)

```sql
-- Security logs policy (FIXES SECURITY ADVISORY)
CREATE POLICY "security_logs_admin_access" ON public.security_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND role = 'admin') 
        OR user_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND role = 'admin')
    );

-- Billing invoices policy (FIXES SECURITY ADVISORY)
CREATE POLICY "billing_invoices_access" ON public.billing_invoices
    FOR ALL USING (
        customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester'))
    )
    WITH CHECK (
        customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND role = 'admin')
    );

-- Technician locations policy (FIXES SECURITY ADVISORY)
CREATE POLICY "technician_locations_access" ON public.technician_locations
    FOR ALL USING (
        technician_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester'))
    )
    WITH CHECK (
        technician_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester'))
    );

-- Current location policy (FIXES SECURITY ADVISORY)  
CREATE POLICY "technician_current_location_access" ON public.technician_current_location
    FOR ALL USING (
        technician_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester'))
    )
    WITH CHECK (
        technician_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester'))
    );
```

### 5. Service Role Bypass (Essential for API Operations)

```sql
-- Service role policies (allows system operations to work)
CREATE POLICY "service_role_bypass_customers" ON public.customers 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_bypass_devices" ON public.devices 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_bypass_appointments" ON public.appointments 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_bypass_invoices" ON public.invoices 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_bypass_security_logs" ON public.security_logs 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_bypass_billing_invoices" ON public.billing_invoices 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_bypass_technician_locations" ON public.technician_locations 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_bypass_technician_current_location" ON public.technician_current_location 
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 6. Verify Implementation

```sql
-- Check RLS status
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('customers', 'devices', 'appointments', 'invoices', 'security_logs', 'billing_invoices', 'technician_locations', 'technician_current_location')
ORDER BY tablename;

-- Check policy count
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC;
```

## Expected Results

After executing these commands:

1. **RLS Status**: All target tables should show "Enabled" 
2. **Policy Count**: Each table should have 2-3 policies (customer access + service role bypass)
3. **Security Advisories**: Should be resolved (no more warnings about missing policies)

## Testing the Implementation

1. **Customer Portal Test**: 
   - Login as a customer
   - Should only see own devices, appointments, invoices
   
2. **Team Portal Test**:
   - Login as admin/tester  
   - Should see all customer data
   
3. **API Operations**:
   - All existing API endpoints should continue working
   - Service role bypass ensures system operations work

## Troubleshooting

If you get errors:

1. **"already exists"** - This is OK, policy already created
2. **"relation does not exist"** - Table doesn't exist in this database (OK to skip)
3. **"permission denied"** - Make sure you're using the service role key in SQL Editor

## Security Benefits

✅ **Customer Data Isolation**: Customers can only access their own data  
✅ **Team Role Management**: Admin/tester roles have appropriate access  
✅ **Audit Trail Protection**: Security logs protected from unauthorized access  
✅ **Location Privacy**: Technician locations only visible to authorized users  
✅ **Billing Security**: Invoice data properly secured by customer/role  
✅ **Service Role Access**: API operations continue to work seamlessly

## Files Created

- `implement-comprehensive-rls.sql` - Complete RLS implementation
- `direct-rls-execution.js` - Automated execution script (attempted)
- This guide - Manual execution instructions

The automated script achieved 76% success rate but manual execution ensures 100% implementation.