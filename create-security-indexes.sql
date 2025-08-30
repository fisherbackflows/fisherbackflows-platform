-- Step 4: Create indexes for performance
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