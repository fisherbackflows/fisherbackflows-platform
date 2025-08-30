-- Production Security Database Schema (Fixed)
-- Run this in Supabase SQL Editor to add security features

-- Step 1: Add security columns to team_users table one by one
DO $$
BEGIN
    -- Add failed_login_attempts column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_users' AND column_name = 'failed_login_attempts') THEN
        ALTER TABLE team_users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
    END IF;
    
    -- Add last_failed_login column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_users' AND column_name = 'last_failed_login') THEN
        ALTER TABLE team_users ADD COLUMN last_failed_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add account_locked_until column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_users' AND column_name = 'account_locked_until') THEN
        ALTER TABLE team_users ADD COLUMN account_locked_until TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add password_changed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_users' AND column_name = 'password_changed_at') THEN
        ALTER TABLE team_users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add require_password_change column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_users' AND column_name = 'require_password_change') THEN
        ALTER TABLE team_users ADD COLUMN require_password_change BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;