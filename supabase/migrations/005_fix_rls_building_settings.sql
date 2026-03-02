-- Fix auth_rls_initplan performance warning on building_settings table.
-- Wrapping auth.uid() in (select auth.uid()) prevents it being re-evaluated
-- for every row, which is the Postgres recommended pattern for RLS with auth helpers.

DROP POLICY IF EXISTS "Super Admins can update settings" ON public.building_settings;

CREATE POLICY "Super Admins can update settings" ON public.building_settings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'super_admin'
  )
);
