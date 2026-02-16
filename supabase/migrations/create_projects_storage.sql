-- Create storage buckets for projects module
-- Run this in Supabase SQL Editor

-- Buckets for covers (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('projects-covers', 'projects-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Buckets for project files (private by default, but we'll use policies)
INSERT INTO storage.buckets (id, name, public)
VALUES ('projects-files', 'projects-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for projects-covers (Public Read)
DROP POLICY IF EXISTS "Public Read Projects Covers" ON storage.objects;
CREATE POLICY "Public Read Projects Covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'projects-covers');

DROP POLICY IF EXISTS "Admin Manage Projects Covers" ON storage.objects;
CREATE POLICY "Admin Manage Projects Covers"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'projects-covers' AND public.is_admin())
WITH CHECK (bucket_id = 'projects-covers' AND public.is_admin());

-- Policies for projects-files (Secure/Protected)
-- Only owners (purchased) or admins can read
DROP POLICY IF EXISTS "Owners and Admins Read Project Files" ON storage.objects;
CREATE POLICY "Owners and Admins Read Project Files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'projects-files' AND (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.project_files pf
            JOIN public.project_purchases pp ON pp.project_id = pf.project_id
            WHERE pf.file_url LIKE '%' || storage.objects.name AND pp.user_id = auth.uid()
        )
    )
);

-- Admins can manage all files
DROP POLICY IF EXISTS "Admins Manage Projects Files" ON storage.objects;
CREATE POLICY "Admins Manage Projects Files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'projects-files' AND public.is_admin())
WITH CHECK (bucket_id = 'projects-files' AND public.is_admin());
