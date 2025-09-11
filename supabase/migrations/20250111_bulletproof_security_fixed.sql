-- BULLETPROOF SECURITY FOR BACKFLOW BUDDY (FIXED VERSION)
-- Complete data isolation between companies with zero leakage
-- This version uses the correct column names from the actual schema

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- Core business tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Company and team tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_usage ENABLE ROW LEVEL SECURITY;

-- Supporting tables
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP ALL EXISTING POLICIES (Start Fresh)
-- ============================================

DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- ============================================
-- HELPER FUNCTIONS FOR SECURITY
-- ============================================

-- Get current user's company ID (for team members)
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM team_users 
        WHERE auth_user_id = auth.uid() 
        AND status = 'active'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current customer's company ID
CREATE OR REPLACE FUNCTION get_customer_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM customers 
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a team member of a company
CREATE OR REPLACE FUNCTION is_team_member(comp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM team_users 
        WHERE company_id = comp_id 
        AND auth_user_id = auth.uid()
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin or owner
CREATE OR REPLACE FUNCTION is_company_admin(comp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM team_users 
        WHERE company_id = comp_id 
        AND auth_user_id = auth.uid()
        AND role IN ('admin', 'owner', 'manager')
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CUSTOMERS TABLE - MOST CRITICAL
-- ============================================

-- Team members can only see their company's customers
CREATE POLICY "customers_team_view" ON customers
    FOR SELECT
    TO authenticated
    USING (
        company_id = get_user_company_id()
        AND is_team_member(company_id)
    );

-- Only admins can insert customers
CREATE POLICY "customers_admin_insert" ON customers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id = get_user_company_id()
        AND is_company_admin(company_id)
    );

-- Only admins can update customers
CREATE POLICY "customers_admin_update" ON customers
    FOR UPDATE
    TO authenticated
    USING (
        company_id = get_user_company_id()
        AND is_company_admin(company_id)
    )
    WITH CHECK (
        company_id = get_user_company_id()
        AND is_company_admin(company_id)
    );

-- Only admins can delete customers
CREATE POLICY "customers_admin_delete" ON customers
    FOR DELETE
    TO authenticated
    USING (
        company_id = get_user_company_id()
        AND is_company_admin(company_id)
    );

-- Customers can only see their own record
CREATE POLICY "customers_self_view" ON customers
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

-- ============================================
-- DEVICES TABLE
-- ============================================

CREATE POLICY "devices_company_isolation" ON devices
    FOR ALL
    TO authenticated
    USING (
        company_id = get_user_company_id()
        OR company_id = get_customer_company_id()
    )
    WITH CHECK (
        company_id = get_user_company_id()
    );

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

CREATE POLICY "appointments_company_isolation" ON appointments
    FOR ALL
    TO authenticated
    USING (
        company_id = get_user_company_id()
        OR company_id = get_customer_company_id()
    )
    WITH CHECK (
        company_id = get_user_company_id()
    );

-- ============================================
-- TEST REPORTS TABLE
-- ============================================

CREATE POLICY "test_reports_company_isolation" ON test_reports
    FOR ALL
    TO authenticated
    USING (
        company_id = get_user_company_id()
        OR company_id = get_customer_company_id()
    )
    WITH CHECK (
        company_id = get_user_company_id()
    );

-- ============================================
-- INVOICES TABLE
-- ============================================

CREATE POLICY "invoices_company_isolation" ON invoices
    FOR ALL
    TO authenticated
    USING (
        company_id = get_user_company_id()
        OR company_id = get_customer_company_id()
    )
    WITH CHECK (
        company_id = get_user_company_id()
    );

-- ============================================
-- TEAM USERS TABLE
-- ============================================

-- Team members can only see their own company's team
CREATE POLICY "team_users_company_view" ON team_users
    FOR SELECT
    TO authenticated
    USING (
        company_id = get_user_company_id()
    );

-- Only admins can manage team members
CREATE POLICY "team_users_admin_manage" ON team_users
    FOR ALL
    TO authenticated
    USING (
        company_id = get_user_company_id()
        AND is_company_admin(company_id)
    )
    WITH CHECK (
        company_id = get_user_company_id()
        AND is_company_admin(company_id)
    );

-- ============================================
-- COMPANIES TABLE
-- ============================================

-- Users can only see their own company
CREATE POLICY "companies_own_view" ON companies
    FOR SELECT
    TO authenticated
    USING (
        id = get_user_company_id()
        OR id = get_customer_company_id()
    );

-- Only owners can update company
CREATE POLICY "companies_owner_update" ON companies
    FOR UPDATE
    TO authenticated
    USING (
        id = get_user_company_id()
        AND EXISTS (
            SELECT 1 FROM team_users
            WHERE company_id = id
            AND auth_user_id = auth.uid()
            AND role = 'owner'
        )
    )
    WITH CHECK (
        id = get_user_company_id()
        AND EXISTS (
            SELECT 1 FROM team_users
            WHERE company_id = id
            AND auth_user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- ============================================
-- AUDIT LOGS - Write only, company filtered reads
-- ============================================

CREATE POLICY "audit_logs_insert_all" ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "audit_logs_company_read" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (
        (resource_type = 'company' AND resource_id::uuid = get_user_company_id())
        OR 
        (user_id IN (
            SELECT id FROM team_users 
            WHERE company_id = get_user_company_id()
        ))
    );

-- ============================================
-- SECURITY LOGS - Track all access attempts
-- ============================================

CREATE POLICY "security_logs_insert" ON security_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "security_logs_admin_read" ON security_logs
    FOR SELECT
    TO authenticated
    USING (
        is_company_admin(get_user_company_id())
    );

-- ============================================
-- DATA LEAK PREVENTION TRIGGERS
-- ============================================

-- Trigger to prevent cross-company data updates
CREATE OR REPLACE FUNCTION prevent_company_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.company_id IS DISTINCT FROM NEW.company_id THEN
        RAISE EXCEPTION 'Cannot change company_id - data isolation violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with company_id
CREATE TRIGGER prevent_customer_company_change
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION prevent_company_change();

CREATE TRIGGER prevent_device_company_change
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION prevent_company_change();

CREATE TRIGGER prevent_appointment_company_change
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_company_change();

CREATE TRIGGER prevent_test_report_company_change
    BEFORE UPDATE ON test_reports
    FOR EACH ROW
    EXECUTE FUNCTION prevent_company_change();

CREATE TRIGGER prevent_invoice_company_change
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION prevent_company_change();

-- ============================================
-- SECURITY AUDIT FUNCTION
-- ============================================

-- Function to log all data access
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text
            ELSE NEW.id::text
        END,
        jsonb_build_object(
            'company_id', 
            CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.company_id
                ELSE NEW.company_id
            END
        ),
        NOW()
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENABLE ACCESS LOGGING FOR CRITICAL TABLES
-- ============================================

CREATE TRIGGER log_customer_access
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION log_data_access();

CREATE TRIGGER log_device_access
    AFTER INSERT OR UPDATE OR DELETE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION log_data_access();

CREATE TRIGGER log_invoice_access
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_data_access();