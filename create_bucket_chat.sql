-- Create storage bucket for Chat Uploads
-- This is necessary for Audio messages and file attachments

-- 1. Insert into storage.buckets if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access chat-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload chat-uploads" ON storage.objects;
DROP POLICY IF EXISTS "User Delete Own Files chat-uploads" ON storage.objects;

-- 3. Create Policy: Public Read Access
CREATE POLICY "Public Access chat-uploads" ON storage.objects
FOR SELECT
USING ( bucket_id = 'chat-uploads' );

-- 4. Create Policy: Authenticated Upload Access
CREATE POLICY "Authenticated Upload chat-uploads" ON storage.objects
FOR INSERT
WITH CHECK ( bucket_id = 'chat-uploads' AND auth.role() = 'authenticated' );

-- 5. Create Policy: User can delete own files (optional)
CREATE POLICY "User Delete Own Files chat-uploads" ON storage.objects
FOR DELETE
USING ( bucket_id = 'chat-uploads' AND auth.uid() = owner );
