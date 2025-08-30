-- Step 3: Update team_sessions table for enhanced security
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