# 🔐 Production Security Setup Instructions

## ⚠️ CRITICAL: Run these SQL commands in Supabase SQL Editor in this exact order

### Step 1: Update team_users table
```sql
-- Copy and paste this entire block into Supabase SQL Editor:

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
```

### Step 2: Create security_logs table
```sql
-- Copy and paste this into Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_email TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Update team_sessions table
```sql
-- Copy and paste this into Supabase SQL Editor:

DO $$
BEGIN
    -- Add ip_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_sessions' AND column_name = 'ip_address') THEN
        ALTER TABLE team_sessions ADD COLUMN ip_address TEXT;
    END IF;
    
    -- Add user_agent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_sessions' AND column_name = 'user_agent') THEN
        ALTER TABLE team_sessions ADD COLUMN user_agent TEXT;
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_sessions' AND column_name = 'is_active') THEN
        ALTER TABLE team_sessions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add last_activity column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_sessions' AND column_name = 'last_activity') THEN
        ALTER TABLE team_sessions ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END
$$;
```

### Step 4: Create indexes for performance
```sql
-- Copy and paste this into Supabase SQL Editor:

CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_email ON security_logs(user_email);

CREATE INDEX IF NOT EXISTS idx_team_users_email ON team_users(email);
CREATE INDEX IF NOT EXISTS idx_team_users_failed_attempts ON team_users(failed_login_attempts);
CREATE INDEX IF NOT EXISTS idx_team_users_locked_until ON team_users(account_locked_until);

CREATE INDEX IF NOT EXISTS idx_team_sessions_token ON team_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_team_sessions_expires ON team_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_team_sessions_active ON team_sessions(is_active);
```

### Step 5: Create utility functions
```sql
-- Copy and paste this into Supabase SQL Editor:

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM team_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION unlock_expired_accounts()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE team_users 
    SET account_locked_until = NULL,
        failed_login_attempts = 0
    WHERE account_locked_until < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🎯 After Running All SQL Commands

### Generate Secure Admin Password
Run this in your terminal:
```bash
node setup-secure-admin-password.js
```

**⚠️ CRITICAL: Save the generated password in a secure password manager!**

### Test the New Authentication
1. Go to https://www.fisherbackflows.com/team-portal
2. Use the generated credentials
3. Verify the new security features are working

## ✅ Success Confirmation
After completing all steps, you should see:
- All SQL commands executed without errors
- Secure admin password generated
- New authentication system working
- Security logging active

The platform now has **BANK-LEVEL SECURITY** with enterprise-grade authentication! 🏦