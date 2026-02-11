-- Fix RLS policies for tool_orientation_files
-- This table was enabled for RLS but had no policies, causing 403 Forbidden on inserts.

-- 1. Grant full access to Admins
CREATE POLICY "Admin full tool_orientation_files" ON public.tool_orientation_files
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Grant read access to users with subscription (matching tools policy)
CREATE POLICY "Access tool files with subscription" ON public.tool_orientation_files
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);
