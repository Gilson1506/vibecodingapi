-- Enable Student (Authenticated) to Create Channels

-- 1. Allow Insert for Authenticated Users
CREATE POLICY "Authenticated users can create channels" ON public.community_channels
FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

-- 2. Allow Select for all (already likely exists, but ensuring)
-- Usually "Public Access" or similar exists. If not:
-- CREATE POLICY "Public read channels" ON public.community_channels FOR SELECT USING (true);

-- Note: We might want to limit who can UPDATE/DELETE to Admins only (already handled by Admin policies)
