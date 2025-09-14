-- Step 2: Create user_invitations table
-- Execute this second in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'tester',
    permissions JSONB DEFAULT '{}',
    invited_by UUID NOT NULL REFERENCES team_users(id),
    invitation_token VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES team_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, email),
    CONSTRAINT user_invitations_role_check
    CHECK (role IN ('company_admin', 'manager', 'tester', 'scheduler', 'billing_admin')),
    CONSTRAINT user_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_company_id ON user_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);