-- List of buckets to ensure exist and are public
-- materials, course-covers, lesson-thumbnails, tool-covers, tool-files, avatars

-- Helper to create public bucket if not exists
insert into storage.buckets (id, name, public)
values 
  ('materials', 'materials', true),
  ('course-covers', 'course-covers', true),
  ('lesson-thumbnails', 'lesson-thumbnails', true),
  ('tool-covers', 'tool-covers', true),
  ('tool-files', 'tool-files', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- DROP EXISTING POLICIES TO AVOID CONFLICTS (Optional but cleaner for this script)
-- drop policy if exists "Public Access Materials" on storage.objects;
-- drop policy if exists "Authenticated Uploads" on storage.objects;
-- ... doing a consolidated policy approach is better

-- 1. PUBLIC READ ACCESS (Global for these buckets)
create policy "Public Read Access"
  on storage.objects for select
  using ( bucket_id in ('materials', 'course-covers', 'lesson-thumbnails', 'tool-covers', 'tool-files', 'avatars') );

-- 2. AUTHENTICATED UPLOAD ACCESS
create policy "Authenticated Upload Access"
  on storage.objects for insert
  with check ( 
    bucket_id in ('materials', 'course-covers', 'lesson-thumbnails', 'tool-covers', 'tool-files', 'avatars') 
    and auth.role() = 'authenticated' 
  );

-- 3. AUTHENTICATED UPDATE ACCESS
create policy "Authenticated Update Access"
  on storage.objects for update
  using ( 
    bucket_id in ('materials', 'course-covers', 'lesson-thumbnails', 'tool-covers', 'tool-files', 'avatars') 
    and auth.role() = 'authenticated' 
  );

-- 4. AUTHENTICATED DELETE ACCESS
create policy "Authenticated Delete Access"
  on storage.objects for delete
  using ( 
    bucket_id in ('materials', 'course-covers', 'lesson-thumbnails', 'tool-covers', 'tool-files', 'avatars') 
    and auth.role() = 'authenticated' 
  );
