-- ============================================
-- SUPABASE STORAGE CONFIGURATION
-- ============================================
-- Este script cria os buckets de storage e políticas
-- para uploads de arquivos dos frontends
-- ============================================

-- CRIAR BUCKETS
-- ============================================

-- 1. Avatars de usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Capas de cursos
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-covers', 'course-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Thumbnails de aulas
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-thumbnails', 'lesson-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Materiais de apoio (PDFs, arquivos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Ferramentas - arquivos de orientação
INSERT INTO storage.buckets (id, name, public)
VALUES ('tool-files', 'tool-files', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Capas de ferramentas
INSERT INTO storage.buckets (id, name, public)
VALUES ('tool-covers', 'tool-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Anexos da comunidade
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-attachments', 'community-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS DE STORAGE (RLS)
-- ============================================

-- AVATARS
-- Qualquer usuário autenticado pode fazer upload do próprio avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Qualquer um pode ver avatars (bucket público)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Usuários podem atualizar próprio avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuários podem deletar próprio avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- COURSE COVERS
-- ============================================

-- Admin pode fazer upload de capas de cursos
CREATE POLICY "Admin can upload course covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-covers' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Qualquer um pode ver capas (bucket público)
CREATE POLICY "Anyone can view course covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-covers');

-- Admin pode atualizar capas
CREATE POLICY "Admin can update course covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-covers' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Admin pode deletar capas
CREATE POLICY "Admin can delete course covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-covers' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- LESSON THUMBNAILS
-- ============================================

-- Admin pode fazer upload de thumbnails
CREATE POLICY "Admin can upload lesson thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-thumbnails' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Qualquer um pode ver thumbnails (bucket público)
CREATE POLICY "Anyone can view lesson thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-thumbnails');

-- Admin pode atualizar thumbnails
CREATE POLICY "Admin can update lesson thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-thumbnails' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Admin pode deletar thumbnails
CREATE POLICY "Admin can delete lesson thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-thumbnails' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- MATERIALS (Privado - apenas com acesso)
-- ============================================

-- Admin pode fazer upload de materiais
CREATE POLICY "Admin can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Usuários com acesso podem ver materiais
CREATE POLICY "Users with access can view materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);

-- Admin pode atualizar materiais
CREATE POLICY "Admin can update materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materials' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Admin pode deletar materiais
CREATE POLICY "Admin can delete materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- TOOL FILES (Privado - apenas com acesso)
-- ============================================

-- Admin pode fazer upload de arquivos de ferramentas
CREATE POLICY "Admin can upload tool files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tool-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Usuários com acesso podem ver arquivos de ferramentas
CREATE POLICY "Users with access can view tool files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tool-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);

-- Admin pode atualizar arquivos
CREATE POLICY "Admin can update tool files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tool-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Admin pode deletar arquivos
CREATE POLICY "Admin can delete tool files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tool-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- TOOL COVERS
-- ============================================

-- Admin pode fazer upload de capas de ferramentas
CREATE POLICY "Admin can upload tool covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tool-covers' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Qualquer um pode ver capas (bucket público)
CREATE POLICY "Anyone can view tool covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tool-covers');

-- Admin pode atualizar capas
CREATE POLICY "Admin can update tool covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tool-covers' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Admin pode deletar capas
CREATE POLICY "Admin can delete tool covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tool-covers' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- COMMUNITY ATTACHMENTS (Privado)
-- ============================================

-- Usuários com acesso podem fazer upload de anexos
CREATE POLICY "Users with access can upload community attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-attachments' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);

-- Usuários com acesso podem ver anexos
CREATE POLICY "Users with access can view community attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'community-attachments' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);

-- Usuários podem deletar próprios anexos
CREATE POLICY "Users can delete own community attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- FIM DA CONFIGURAÇÃO DE STORAGE
-- ============================================
