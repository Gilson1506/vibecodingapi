-- Fix RLS policies for Community features
-- Enables Admin to manage channels and moderate messages

-- 1. community_channels: Admin Full Access
CREATE POLICY "Admin full community_channels" ON public.community_channels
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 2. community_messages: Admin Full Access (Delete/Moderate)
-- Note: Existing policy might cover users, but we ensure Admin specific overriding
CREATE POLICY "Admin full community_messages" ON public.community_messages
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
