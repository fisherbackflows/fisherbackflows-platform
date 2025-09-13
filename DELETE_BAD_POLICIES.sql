-- DELETE THE POLICIES THAT ARE EXPOSING EVERYTHING!
-- These "Service role access" policies with qual="true" and roles="{public}" 
-- are giving everyone full access to all data!

DROP POLICY "Service role access" ON public.devices;
DROP POLICY "Service role access" ON public.appointments;
DROP POLICY "Service role access" ON public.test_reports;
DROP POLICY "Service role access" ON public.invoices;
DROP POLICY "Service role access" ON public.payments;

-- Also drop the "authenticated_api_access" policies that are redundant
DROP POLICY IF EXISTS "authenticated_api_access" ON public.devices;
DROP POLICY IF EXISTS "authenticated_api_access" ON public.appointments;
DROP POLICY IF EXISTS "authenticated_api_access" ON public.test_reports;

SELECT 'DELETED POLICIES THAT WERE EXPOSING ALL DATA' as status;