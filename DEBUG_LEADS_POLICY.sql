-- Debug the leads table policy

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'leads';

-- Check what policies exist
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'leads';

-- Check if the helper function exists and works
SELECT public.is_team_member() as team_member_check;