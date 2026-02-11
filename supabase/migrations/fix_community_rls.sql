-- Fix RLS for community_messages to restrict DELETE
DROP POLICY IF EXISTS "Community messages access" ON public.community_messages;

-- Separate policies for better control
CREATE POLICY "View messages" ON public.community_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);

CREATE POLICY "Insert messages" ON public.community_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);

CREATE POLICY "Update own messages" ON public.community_messages FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "Delete own or admin messages" ON public.community_messages FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
