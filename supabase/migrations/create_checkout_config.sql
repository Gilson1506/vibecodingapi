-- =====================================================
-- Checkout Configuration Table and RPC Functions
-- =====================================================

-- 1. Create the checkout_config table
CREATE TABLE IF NOT EXISTS public.checkout_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    
    -- Video (Mux)
    mux_playback_id TEXT,
    mux_asset_id TEXT,
    video_title TEXT,
    
    -- Instructor
    instructor_name TEXT,
    instructor_title TEXT,
    instructor_bio TEXT,
    instructor_image TEXT,
    instructor_years_experience INTEGER DEFAULT 0,
    instructor_students_count INTEGER DEFAULT 0,
    instructor_projects_count INTEGER DEFAULT 0,
    
    -- Portfolio Projects (JSON array)
    portfolio_projects JSONB DEFAULT '[]'::jsonb,
    
    -- Benefits ("Por que escolher")
    benefits JSONB DEFAULT '[]'::jsonb,
    
    -- Lesson Covers (JSON object: {lesson_id: image_url})
    lesson_covers JSONB DEFAULT '{}'::jsonb,
    
    -- Pricing
    price_display TEXT,
    price_subtitle TEXT,
    price_features JSONB DEFAULT '[]'::jsonb,
    
    -- Contact
    whatsapp_number TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(course_id)
);

-- Enable RLS
ALTER TABLE public.checkout_config ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies

-- Anyone can read active config (for checkout page)
CREATE POLICY "Anyone can read active checkout config"
ON public.checkout_config FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage checkout config"
ON public.checkout_config FOR ALL
USING (public.is_admin());

-- 3. RPC Functions

-- Get active checkout config with course and lessons data
CREATE OR REPLACE FUNCTION public.get_active_checkout_config()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'config', row_to_json(cc.*),
        'course', json_build_object(
            'id', c.id,
            'title', c.title,
            'description', c.description,
            'price_cents', c.price_cents
        ),
        'lessons', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', l.id,
                'title', l.title,
                'duration_minutes', l.duration_minutes,
                'order_index', l.order_index
            ) ORDER BY l.order_index), '[]'::json)
            FROM public.lessons l
            WHERE l.course_id = c.id AND l.is_published = true
        )
    ) INTO result
    FROM public.checkout_config cc
    JOIN public.courses c ON c.id = cc.course_id
    WHERE cc.is_active = true
    LIMIT 1;
    
    RETURN result;
END;
$$;

-- Get checkout config by course ID (for admin)
CREATE OR REPLACE FUNCTION public.get_checkout_config(p_course_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'config', row_to_json(cc.*),
        'course', json_build_object(
            'id', c.id,
            'title', c.title,
            'description', c.description,
            'price_cents', c.price_cents
        ),
        'lessons', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', l.id,
                'title', l.title,
                'duration_minutes', l.duration_minutes,
                'order_index', l.order_index
            ) ORDER BY l.order_index), '[]'::json)
            FROM public.lessons l
            WHERE l.course_id = c.id
        )
    ) INTO result
    FROM public.checkout_config cc
    RIGHT JOIN public.courses c ON c.id = cc.course_id
    WHERE c.id = p_course_id;
    
    RETURN result;
END;
$$;

-- Upsert checkout config
CREATE OR REPLACE FUNCTION public.upsert_checkout_config(
    p_course_id UUID,
    p_is_active BOOLEAN DEFAULT true,
    p_mux_playback_id TEXT DEFAULT NULL,
    p_mux_asset_id TEXT DEFAULT NULL,
    p_video_title TEXT DEFAULT NULL,
    p_instructor_name TEXT DEFAULT NULL,
    p_instructor_title TEXT DEFAULT NULL,
    p_instructor_bio TEXT DEFAULT NULL,
    p_instructor_image TEXT DEFAULT NULL,
    p_instructor_years_experience INTEGER DEFAULT 0,
    p_instructor_students_count INTEGER DEFAULT 0,
    p_instructor_projects_count INTEGER DEFAULT 0,
    p_portfolio_projects JSONB DEFAULT '[]'::jsonb,
    p_benefits JSONB DEFAULT '[]'::jsonb,
    p_lesson_covers JSONB DEFAULT '{}'::jsonb,
    p_price_display TEXT DEFAULT NULL,
    p_price_subtitle TEXT DEFAULT NULL,
    p_price_features JSONB DEFAULT '[]'::jsonb,
    p_whatsapp_number TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config checkout_config;
BEGIN
    -- Check if caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- If setting as active, deactivate others
    IF p_is_active THEN
        UPDATE public.checkout_config SET is_active = false WHERE course_id != p_course_id;
    END IF;

    -- Upsert
    INSERT INTO public.checkout_config (
        course_id, is_active, mux_playback_id, mux_asset_id, video_title,
        instructor_name, instructor_title, instructor_bio, instructor_image,
        instructor_years_experience, instructor_students_count, instructor_projects_count,
        portfolio_projects, benefits, lesson_covers,
        price_display, price_subtitle, price_features, whatsapp_number,
        updated_at
    ) VALUES (
        p_course_id, p_is_active, p_mux_playback_id, p_mux_asset_id, p_video_title,
        p_instructor_name, p_instructor_title, p_instructor_bio, p_instructor_image,
        p_instructor_years_experience, p_instructor_students_count, p_instructor_projects_count,
        p_portfolio_projects, p_benefits, p_lesson_covers,
        p_price_display, p_price_subtitle, p_price_features, p_whatsapp_number,
        NOW()
    )
    ON CONFLICT (course_id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        mux_playback_id = EXCLUDED.mux_playback_id,
        mux_asset_id = EXCLUDED.mux_asset_id,
        video_title = EXCLUDED.video_title,
        instructor_name = EXCLUDED.instructor_name,
        instructor_title = EXCLUDED.instructor_title,
        instructor_bio = EXCLUDED.instructor_bio,
        instructor_image = EXCLUDED.instructor_image,
        instructor_years_experience = EXCLUDED.instructor_years_experience,
        instructor_students_count = EXCLUDED.instructor_students_count,
        instructor_projects_count = EXCLUDED.instructor_projects_count,
        portfolio_projects = EXCLUDED.portfolio_projects,
        benefits = EXCLUDED.benefits,
        lesson_covers = EXCLUDED.lesson_covers,
        price_display = EXCLUDED.price_display,
        price_subtitle = EXCLUDED.price_subtitle,
        price_features = EXCLUDED.price_features,
        whatsapp_number = EXCLUDED.whatsapp_number,
        updated_at = NOW()
    RETURNING * INTO v_config;

    RETURN row_to_json(v_config);
END;
$$;

-- Get courses for admin dropdown
CREATE OR REPLACE FUNCTION public.get_courses_for_checkout()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(json_build_object(
            'id', c.id,
            'title', c.title,
            'price_cents', c.price_cents,
            'has_config', EXISTS(SELECT 1 FROM checkout_config cc WHERE cc.course_id = c.id),
            'is_active_checkout', EXISTS(SELECT 1 FROM checkout_config cc WHERE cc.course_id = c.id AND cc.is_active = true)
        ) ORDER BY c.title), '[]'::json)
        FROM public.courses c
        WHERE c.is_published = true
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_active_checkout_config() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkout_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_checkout_config(UUID, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, JSONB, JSONB, JSONB, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_courses_for_checkout() TO authenticated;
