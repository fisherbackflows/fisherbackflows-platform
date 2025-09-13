-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
-- Strict multi-tenant isolation with role-based access

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

-- SELECT: Users can see organizations they belong to
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (is_org_member(id));

-- INSERT: Only authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only admins can update organizations
CREATE POLICY "Admins can update organizations"
    ON organizations FOR UPDATE
    USING (has_role(id, ARRAY['admin']::user_role[]))
    WITH CHECK (has_role(id, ARRAY['admin']::user_role[]));

-- DELETE: Only admins can delete organizations
CREATE POLICY "Admins can delete organizations"
    ON organizations FOR DELETE
    USING (has_role(id, ARRAY['admin']::user_role[]));

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- SELECT: Users can view profiles in their organizations
CREATE POLICY "Users can view profiles in their orgs"
    ON profiles FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_org_memberships m1
            JOIN user_org_memberships m2 ON m1.org_id = m2.org_id
            WHERE m1.user_id = auth.uid()
            AND m2.user_id = profiles.user_id
            AND m1.is_active = TRUE
            AND m2.is_active = TRUE
        )
    );

-- INSERT: Handled by trigger
-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Handled by cascade from auth.users

-- ============================================
-- USER_ORG_MEMBERSHIPS POLICIES
-- ============================================

-- SELECT: Members can view memberships in their organizations
CREATE POLICY "Members can view org memberships"
    ON user_org_memberships FOR SELECT
    USING (is_org_member(org_id));

-- INSERT: Admins and managers can add members
CREATE POLICY "Admins/managers can add members"
    ON user_org_memberships FOR INSERT
    WITH CHECK (has_role(org_id, ARRAY['admin', 'manager']::user_role[]));

-- UPDATE: Admins can update memberships
CREATE POLICY "Admins can update memberships"
    ON user_org_memberships FOR UPDATE
    USING (has_role(org_id, ARRAY['admin']::user_role[]))
    WITH CHECK (has_role(org_id, ARRAY['admin']::user_role[]));

-- DELETE: Admins can remove members
CREATE POLICY "Admins can remove members"
    ON user_org_memberships FOR DELETE
    USING (has_role(org_id, ARRAY['admin']::user_role[]));

-- ============================================
-- CUSTOMERS POLICIES
-- ============================================

-- SELECT: All org members can view customers
CREATE POLICY "Org members can view customers"
    ON customers FOR SELECT
    USING (is_org_member(org_id));

-- INSERT: Admin, manager, coordinator can create customers
CREATE POLICY "Authorized roles can create customers"
    ON customers FOR INSERT
    WITH CHECK (
        has_role(org_id, ARRAY['admin', 'manager', 'coordinator']::user_role[])
        AND org_id IS NOT NULL
    );

-- UPDATE: Admin, manager, coordinator can update customers
CREATE POLICY "Authorized roles can update customers"
    ON customers FOR UPDATE
    USING (has_role(org_id, ARRAY['admin', 'manager', 'coordinator']::user_role[]))
    WITH CHECK (has_role(org_id, ARRAY['admin', 'manager', 'coordinator']::user_role[]));

-- DELETE: Only admins can delete customers
CREATE POLICY "Admins can delete customers"
    ON customers FOR DELETE
    USING (has_role(org_id, ARRAY['admin']::user_role[]));

-- ============================================
-- WORK_ORDERS POLICIES
-- ============================================

-- SELECT: All org members can view work orders
CREATE POLICY "Org members can view work orders"
    ON work_orders FOR SELECT
    USING (is_org_member(org_id));

-- INSERT: Admin, manager, coordinator can create work orders
CREATE POLICY "Authorized roles can create work orders"
    ON work_orders FOR INSERT
    WITH CHECK (
        has_role(org_id, ARRAY['admin', 'manager', 'coordinator']::user_role[])
        AND org_id IS NOT NULL
    );

-- UPDATE: Admin, manager, coordinator, or assigned user can update
CREATE POLICY "Authorized roles or assignee can update work orders"
    ON work_orders FOR UPDATE
    USING (
        has_role(org_id, ARRAY['admin', 'manager', 'coordinator']::user_role[])
        OR assigned_to = auth.uid()
    )
    WITH CHECK (
        has_role(org_id, ARRAY['admin', 'manager', 'coordinator']::user_role[])
        OR assigned_to = auth.uid()
    );

-- DELETE: Only admins can delete work orders
CREATE POLICY "Admins can delete work orders"
    ON work_orders FOR DELETE
    USING (has_role(org_id, ARRAY['admin']::user_role[]));

-- ============================================
-- INSPECTIONS POLICIES
-- ============================================

-- SELECT: All org members can view inspections
CREATE POLICY "Org members can view inspections"
    ON inspections FOR SELECT
    USING (is_org_member(org_id));

-- INSERT: Inspector, technician, coordinator, manager, admin can create
CREATE POLICY "Authorized roles can create inspections"
    ON inspections FOR INSERT
    WITH CHECK (
        has_role(org_id, ARRAY['admin', 'manager', 'coordinator', 'inspector', 'technician']::user_role[])
        AND org_id IS NOT NULL
    );

-- UPDATE: Admin, manager, or the inspector (for draft/submitted status)
CREATE POLICY "Authorized roles or inspector can update inspections"
    ON inspections FOR UPDATE
    USING (
        has_role(org_id, ARRAY['admin', 'manager']::user_role[])
        OR (inspector_id = auth.uid() AND status IN ('draft', 'submitted'))
    )
    WITH CHECK (
        has_role(org_id, ARRAY['admin', 'manager']::user_role[])
        OR (inspector_id = auth.uid() AND status IN ('draft', 'submitted'))
    );

-- DELETE: Only admins can delete inspections
CREATE POLICY "Admins can delete inspections"
    ON inspections FOR DELETE
    USING (has_role(org_id, ARRAY['admin']::user_role[]));

-- ============================================
-- REPORTS POLICIES
-- ============================================

-- SELECT: All org members can view reports
CREATE POLICY "Org members can view reports"
    ON reports FOR SELECT
    USING (is_org_member(org_id));

-- INSERT: System/service role creates reports (via background jobs)
-- Handled by service role

-- UPDATE: Reports are immutable
-- No update policy

-- DELETE: Only admins can delete reports
CREATE POLICY "Admins can delete reports"
    ON reports FOR DELETE
    USING (has_role(org_id, ARRAY['admin']::user_role[]));

-- ============================================
-- INVOICES POLICIES
-- ============================================

-- SELECT: All org members can view invoices
CREATE POLICY "Org members can view invoices"
    ON invoices FOR SELECT
    USING (is_org_member(org_id));

-- INSERT: Admin, manager, coordinator can create invoices
CREATE POLICY "Authorized roles can create invoices"
    ON invoices FOR INSERT
    WITH CHECK (
        has_role(org_id, ARRAY['admin', 'manager', 'coordinator']::user_role[])
        AND org_id IS NOT NULL
    );

-- UPDATE: Admin, manager can update invoices
CREATE POLICY "Admin/manager can update invoices"
    ON invoices FOR UPDATE
    USING (has_role(org_id, ARRAY['admin', 'manager']::user_role[]))
    WITH CHECK (has_role(org_id, ARRAY['admin', 'manager']::user_role[]));

-- DELETE: Only admins can delete invoices
CREATE POLICY "Admins can delete invoices"
    ON invoices FOR DELETE
    USING (has_role(org_id, ARRAY['admin']::user_role[]));

-- ============================================
-- JOBS POLICIES
-- ============================================

-- SELECT: Org members can view their org's jobs
CREATE POLICY "Org members can view jobs"
    ON jobs FOR SELECT
    USING (
        org_id IS NULL -- System jobs
        OR is_org_member(org_id)
    );

-- INSERT: Authenticated users can create jobs for their org
CREATE POLICY "Users can create jobs"
    ON jobs FOR INSERT
    WITH CHECK (
        org_id IS NULL -- System jobs via service role
        OR is_org_member(org_id)
    );

-- UPDATE: Service role updates jobs
-- Handled by service role

-- DELETE: Admins can delete their org's jobs
CREATE POLICY "Admins can delete jobs"
    ON jobs FOR DELETE
    USING (
        org_id IS NOT NULL
        AND has_role(org_id, ARRAY['admin']::user_role[])
    );

-- ============================================
-- IDEMPOTENCY_KEYS POLICIES
-- ============================================

-- SELECT: Users can view their own idempotency keys
CREATE POLICY "Users can view own idempotency keys"
    ON idempotency_keys FOR SELECT
    USING (user_id = auth.uid());

-- INSERT: Users can create their own idempotency keys
CREATE POLICY "Users can create idempotency keys"
    ON idempotency_keys FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- UPDATE: Keys are immutable
-- No update policy

-- DELETE: System handles via expiration
-- No delete policy for users

-- ============================================
-- AUDIT_LOGS POLICIES
-- ============================================

-- SELECT: Admins can view their org's audit logs
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        org_id IS NOT NULL
        AND has_role(org_id, ARRAY['admin']::user_role[])
    );

-- INSERT: System creates audit logs
-- Handled by triggers

-- UPDATE: Audit logs are immutable
-- No update policy

-- DELETE: No one can delete audit logs
-- No delete policy

-- ============================================
-- RATE_LIMITS POLICIES
-- ============================================

-- Managed by service role only
-- No user policies

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documents', 'documents', FALSE),
    ('reports', 'reports', FALSE),
    ('temp', 'temp', FALSE)
ON CONFLICT DO NOTHING;

-- Documents bucket - org-scoped paths
CREATE POLICY "Org members can view documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND is_org_member(
            (string_to_array(name, '/'))[1]::UUID
        )
    );

CREATE POLICY "Authorized roles can upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND has_role(
            (string_to_array(name, '/'))[1]::UUID,
            ARRAY['admin', 'manager', 'coordinator', 'inspector', 'technician']::user_role[]
        )
    );

CREATE POLICY "Admins can delete documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents'
        AND has_role(
            (string_to_array(name, '/'))[1]::UUID,
            ARRAY['admin']::user_role[]
        )
    );

-- Reports bucket - read-only for users
CREATE POLICY "Org members can view reports"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'reports'
        AND is_org_member(
            (string_to_array(name, '/'))[1]::UUID
        )
    );

-- Temp bucket - user-scoped
CREATE POLICY "Users can manage own temp files"
    ON storage.objects
    USING (
        bucket_id = 'temp'
        AND (string_to_array(name, '/'))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'temp'
        AND (string_to_array(name, '/'))[1] = auth.uid()::TEXT
    );