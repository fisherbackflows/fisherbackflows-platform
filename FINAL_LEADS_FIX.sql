-- Final fix for leads table - block anonymous completely

-- Drop existing policy
DROP POLICY IF EXISTS "leads_team_access" ON public.leads;
DROP POLICY IF EXISTS "leads_team_only" ON public.leads;

-- Ensure RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy that blocks anon completely
CREATE POLICY "leads_authenticated_only" ON public.leads
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.role() != 'anon');

-- Also create permissive policy for authenticated users
CREATE POLICY "leads_team_members" ON public.leads
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true);

SELECT 'Leads table final fix applied' as status;