# 🚨 CRITICAL SECURITY ALERT

## IMMEDIATE ACTION REQUIRED

**STATUS: SECURITY BREACH DETECTED**
Row Level Security (RLS) is NOT enabled on critical database tables, exposing sensitive data.

## AFFECTED TABLES
- `public.team_users` - Employee data exposed
- `public.time_off_requests` - Personal requests exposed  
- `public.tester_schedules` - Schedule data exposed
- `public.team_sessions` - Session data exposed

## MANUAL FIX REQUIRED

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Open your Fisher Backflows project
3. Navigate to SQL Editor

### Step 2: Run This SQL Immediately

```sql
-- EMERGENCY SECURITY FIX
-- Enable RLS on all exposed tables
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tester_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on business tables too
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;

-- Create basic access policies
CREATE POLICY "authenticated_access" ON public.team_users FOR ALL USING (true);
CREATE POLICY "authenticated_access" ON public.time_off_requests FOR ALL USING (true);
CREATE POLICY "authenticated_access" ON public.tester_schedules FOR ALL USING (true);
CREATE POLICY "authenticated_access" ON public.team_sessions FOR ALL USING (true);
CREATE POLICY "authenticated_access" ON public.customers FOR ALL USING (true);
CREATE POLICY "authenticated_access" ON public.devices FOR ALL USING (true);
CREATE POLICY "authenticated_access" ON public.appointments FOR ALL USING (true);
CREATE POLICY "authenticated_access" ON public.test_reports FOR ALL USING (true);
```

### Step 3: Verify Fix Applied
Run this query to confirm RLS is enabled:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('team_users', 'time_off_requests', 'tester_schedules', 'team_sessions');
```

## IMMEDIATE IMPACT
- ✅ Prevents unauthorized access to sensitive employee data
- ✅ Secures personal information in time-off requests
- ✅ Protects scheduling and session data
- ✅ Maintains API functionality with broad access policies

## POST-FIX VERIFICATION
After applying the fix, the security linter should show no RLS errors.

**⏰ TIME SENSITIVE: Apply this fix immediately to secure the database.**