# Row Level Security (RLS) Implementation Guide

## Critical Security Issue Identified

**🚨 SECURITY ALERT: All 24 database tables are currently WITHOUT Row Level Security protection**

This means any authenticated user can access ALL data in the database, including:
- All customer records
- All team member data  
- All financial records
- All security logs
- All audit trails

## Current Security Status

```
📊 RLS Coverage: 0/24 tables (0.0%)
❌ Tables WITHOUT RLS: 24
⚠️  Tables with RLS but NO policies: 0
✅ Tables with proper RLS and policies: 0
```

## Impact Assessment

### High Risk Data Exposure
- **Customer Data**: Any customer can view other customers' devices, appointments, invoices
- **Financial Data**: Billing information, payment records accessible to all users
- **Internal Data**: Team schedules, technician locations, security logs exposed
- **Audit Trails**: Security logs and audit records can be viewed/modified by any user

### Business Impact
- **GDPR/Privacy Violations**: Customer data not properly isolated
- **Financial Liability**: Exposed payment and billing information
- **Competitive Risk**: Business operations and scheduling visible to customers
- **Audit Compliance**: Security logs not protected from tampering

## Immediate Actions Required

### 1. Run Security Audit
```bash
npm run rls:check
```
This generates a comprehensive report and SQL file for policy implementation.

### 2. Review Generated Policies
The audit creates `database/rls-security-policies.sql` with:
- Helper functions for role checking
- Comprehensive policies for all 24 tables
- Customer data isolation
- Team member access controls
- Admin-only security data protection

### 3. Apply RLS Policies
```bash
npm run rls:apply
```
This safely applies policies with automatic backup and rollback capability.

## RLS Policy Architecture

### Access Control Patterns

#### 1. Customer Data Isolation
```sql
-- Customers can only access their own data
CREATE POLICY "customers_own_data" ON public.customers
  FOR ALL USING (id = auth.uid()::uuid);

-- Applied to: customers, devices, appointments, test_reports, invoices, payments
```

#### 2. Team Member Access
```sql
-- Team members can access all business data
CREATE POLICY "devices_team_access" ON public.devices
  FOR ALL USING (auth.is_team_member());

-- Applied to: all customer-facing tables
```

#### 3. Admin-Only Data
```sql
-- Only admins can access security/audit data
CREATE POLICY "security_logs_admin_access" ON public.security_logs
  FOR ALL USING (auth.is_admin());

-- Applied to: security_logs, audit_logs
```

#### 4. Role-Based Access
```sql
-- Different access levels by role
CREATE POLICY "team_sessions_own_access" ON public.team_sessions
  FOR ALL USING (user_id = auth.uid()::uuid);

CREATE POLICY "team_sessions_admin_access" ON public.team_sessions
  FOR ALL USING (auth.is_admin());
```

### Helper Functions

The implementation includes utility functions:

```sql
-- Check if user is team member with specific roles
auth.is_team_member(required_roles TEXT[])

-- Check if user is admin
auth.is_admin()

-- Check if user is customer
auth.is_customer()
```

## Tables Requiring RLS

### Core Business Tables (High Priority)
- ✅ `customers` - Customer account data
- ✅ `devices` - Backflow prevention devices  
- ✅ `appointments` - Service appointments
- ✅ `test_reports` - Test results and certifications
- ✅ `invoices` - Service invoices
- ✅ `payments` - Payment records

### Team and Operations (High Priority)
- ✅ `team_users` - Internal team members
- ✅ `technician_locations` - GPS tracking data
- ✅ `technician_current_location` - Real-time location
- ✅ `time_off_requests` - Staff scheduling
- ✅ `tester_schedules` - Technician schedules

### Security and Audit (Critical Priority)
- ✅ `security_logs` - Authentication events
- ✅ `audit_logs` - System audit trail
- ✅ `email_verifications` - Email verification tokens

### Financial Data (High Priority) 
- ✅ `billing_subscriptions` - Recurring billing
- ✅ `billing_invoices` - Stripe invoice records

### Configuration and Reference
- ✅ `water_districts` - Water district configs
- ✅ `water_department_submissions` - Report submissions
- ✅ `leads` - Sales leads

### Communication and Notifications
- ✅ `notification_templates` - Push notification templates
- ✅ `push_subscriptions` - PWA notification subscriptions
- ✅ `notification_logs` - Sent notifications
- ✅ `notification_interactions` - User interaction tracking
- ✅ `team_sessions` - Active sessions

## Implementation Steps

### Phase 1: Immediate Security (Required)
1. **Backup Current State**
   ```bash
   npm run rls:check  # Creates backup and analysis
   ```

2. **Apply Core Policies**
   ```bash
   npm run rls:apply  # Applies all RLS policies
   ```

3. **Verify Implementation**
   ```bash
   npm run rls:test   # Tests policy effectiveness
   npm run rls:status # Shows current status
   ```

### Phase 2: Validation and Testing
1. **Test Customer Access**
   - Customers should only see their own data
   - Cross-customer data access should be blocked

2. **Test Team Member Access**
   - Team members should access business data
   - Role-based restrictions should work

3. **Test Admin Access**
   - Admins should access all data including security logs
   - Non-admins should be blocked from sensitive data

### Phase 3: Production Deployment
1. **Schedule Maintenance Window**
   - RLS application may briefly impact database performance
   - Plan for 15-30 minute window

2. **Deploy with Monitoring**
   - Apply policies during low-traffic period
   - Monitor for any access issues
   - Have rollback plan ready

3. **User Communication**
   - Notify users of security improvements
   - Provide support for any access issues

## Testing RLS Policies

### Manual Testing Commands
```sql
-- Test as customer (should only see own data)
SELECT COUNT(*) FROM customers;  -- Should return 1
SELECT COUNT(*) FROM devices WHERE customer_id != auth.uid();  -- Should return 0

-- Test as team member (should see all business data)
SELECT COUNT(*) FROM customers;  -- Should return all customers
SELECT COUNT(*) FROM security_logs;  -- Should fail for non-admin

-- Test as admin (should see everything)
SELECT COUNT(*) FROM security_logs;  -- Should return all logs
```

### Automated Testing
```bash
npm run rls:test
```

## Rollback Procedure

If issues occur after RLS application:

1. **Immediate Rollback**
   ```sql
   -- Disable RLS on all tables (emergency only)
   ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
   -- Repeat for all tables
   ```

2. **Restore from Backup**
   ```bash
   # Use the backup file created during application
   psql -f rls-backup-[timestamp].sql
   ```

3. **Service Role Bypass**
   - API continues working with service role key
   - Service role bypasses ALL RLS policies
   - Provides temporary access while fixing issues

## Monitoring and Maintenance

### Regular Checks
```bash
# Weekly RLS status check
npm run rls:status

# Monthly comprehensive audit
npm run rls:check
```

### Policy Updates
- Review policies quarterly
- Update based on new features
- Monitor for unauthorized access attempts

### Performance Impact
- RLS adds minimal query overhead (~5-10ms)
- Properly indexed policies perform well
- Monitor query performance after implementation

## Security Best Practices

### 1. Service Role Key Usage
- ✅ Use service role key only in server-side API routes
- ❌ Never expose service role key to client-side code  
- ✅ Service role bypasses ALL RLS policies for admin operations

### 2. Client Authentication
- ✅ Use anon key + JWT tokens for client-side access
- ✅ RLS policies apply to anon key connections
- ✅ Regular users get proper data isolation

### 3. Role Management
- ✅ Implement proper role hierarchy (admin > manager > tester)
- ✅ Regular review of team member permissions
- ✅ Automatic role expiration for inactive users

### 4. Audit Trail
- ✅ All policy changes logged to audit_logs
- ✅ Regular review of policy effectiveness
- ✅ Monitor for policy bypass attempts

## Compliance Benefits

### GDPR Compliance
- ✅ Customer data properly isolated by user
- ✅ Data access logged and auditable
- ✅ Technical safeguards implemented

### SOX Compliance (Financial Data)
- ✅ Financial records access controlled
- ✅ Audit trail for all financial data access
- ✅ Separation of duties enforced

### Industry Standards
- ✅ Defense in depth security model
- ✅ Principle of least privilege
- ✅ Data classification and protection

## Conclusion

**Implementing RLS policies is CRITICAL for security and compliance.**

The current state leaves all data exposed to any authenticated user. The provided implementation:

- ✅ Secures all 24 database tables
- ✅ Implements proper access control patterns  
- ✅ Provides comprehensive audit and monitoring
- ✅ Enables compliance with privacy regulations
- ✅ Includes safe deployment and rollback procedures

**Recommended Action: Apply RLS policies immediately using the provided tools and SQL.**