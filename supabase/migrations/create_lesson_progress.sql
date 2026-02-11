-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- RLS Policies
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own progress"
    ON public.lesson_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert/update their own progress
CREATE POLICY "Users can manage their own progress"
    ON public.lesson_progress FOR ALL
    USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
