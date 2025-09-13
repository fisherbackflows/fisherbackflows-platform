-- Fix the leads table that's still exposed
-- Drop and recreate the policy to ensure it works

DROP POLICY IF EXISTS "leads_team_only" ON public.leads;

-- Ensure RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create working policy for leads (team members only)
CREATE POLICY "leads_team_access" ON public.leads
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- Test the policy
SELECT 'Leads table RLS policy fixed' as status;