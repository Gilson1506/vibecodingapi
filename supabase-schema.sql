-- ============================================
-- VIBE CODING - SUPABASE DATABASE SCHEMA
-- ============================================
-- Este script cria todas as 13 tabelas necessárias
-- para a plataforma Vibe Coding
-- ============================================

-- 1. USERS (Estende auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  has_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 2. COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  cover_url TEXT,
  price_cents INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. LESSONS
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  mux_status TEXT DEFAULT 'pending',
  thumbnail_url TEXT,
  is_preview BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id);

-- 4. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'AOA',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  external_id TEXT,
  reference_code TEXT,
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_external ON public.payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_email ON public.payments(customer_email);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('tools', 'materials')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TOOLS
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  cover_url TEXT,
  type TEXT,
  orientation_text TEXT,
  is_available BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tools_category ON public.tools(category_id);

-- 7. TOOL_ORIENTATION_FILES
CREATE TABLE IF NOT EXISTS public.tool_orientation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('image', 'pdf')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. MATERIALS
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('pdf', 'video', 'link', 'file')),
  file_url TEXT,
  file_size INTEGER,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_lesson ON public.materials(lesson_id);

-- 9. LIVE_SESSIONS
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 100,
  mux_live_stream_id TEXT,
  mux_stream_key TEXT,
  mux_playback_id TEXT,
  rtmp_url TEXT DEFAULT 'rtmps://global-live.mux.com:443/app',
  status TEXT DEFAULT 'scheduled',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. LIVE_CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_question BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_chat_session ON public.live_chat_messages(live_session_id);

-- 11. COMMUNITY_CHANNELS
CREATE TABLE IF NOT EXISTS public.community_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  is_default BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. COMMUNITY_MESSAGES
CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  reply_to_id UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_msg_channel ON public.community_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_msg_user ON public.community_messages(user_id);

-- 13. USER_PROGRESS
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON public.user_progress(user_id);

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir canais padrão da comunidade
INSERT INTO public.community_channels (name, slug, type, is_default, order_index) VALUES
  ('geral', 'geral', 'text', true, 0),
  ('duvidas-suporte', 'duvidas-suporte', 'text', false, 1),
  ('projetos-alunos', 'projetos-alunos', 'text', false, 2),
  ('react-js', 'react-js', 'text', false, 3),
  ('off-topic', 'off-topic', 'text', false, 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_orientation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- COURSES
CREATE POLICY "Anyone view published courses" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full courses" ON public.courses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- LESSONS
CREATE POLICY "Users with access view lessons" ON public.lessons FOR SELECT USING (
  is_published = true AND (
    is_preview = true OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
  )
);
CREATE POLICY "Admin full lessons" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- MATERIALS, TOOLS, CATEGORIES
CREATE POLICY "Access content with subscription" ON public.materials FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);
CREATE POLICY "Access tools with subscription" ON public.tools FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);
CREATE POLICY "View categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin full categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full materials" ON public.materials FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full tools" ON public.tools FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- COMMUNITY
CREATE POLICY "Community access" ON public.community_channels FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);
CREATE POLICY "Community messages access" ON public.community_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);

-- USER PROGRESS
CREATE POLICY "Own progress" ON public.user_progress FOR ALL USING (user_id = auth.uid());

-- PAYMENTS
CREATE POLICY "Own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin payments" ON public.payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- LIVE SESSIONS
CREATE POLICY "View live sessions" ON public.live_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);
CREATE POLICY "Admin full live sessions" ON public.live_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- LIVE CHAT
CREATE POLICY "Live chat access" ON public.live_chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_access = true)
);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
