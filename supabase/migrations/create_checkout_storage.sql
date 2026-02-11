-- Create storage bucket for checkout assets
-- Run this in Supabase SQL Editor

-- Note: Storage bucket creation is typically done via Supabase Dashboard
-- Go to Storage > Create bucket > Name: "checkout-assets" > Public: true

-- But you can also enable it via SQL if you have the proper permissions:
INSERT INTO storage.buckets (id, name, public)
VALUES ('checkout-assets', 'checkout-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for checkout-assets bucket

-- Allow anyone to read (public bucket)
CREATE POLICY "Public read access for checkout assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'checkout-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload checkout assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'checkout-assets' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update checkout assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'checkout-assets' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete checkout assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'checkout-assets' AND
  auth.role() = 'authenticated'
);
