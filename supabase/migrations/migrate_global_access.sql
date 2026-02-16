-- =============================================
-- Migration: Grant specific enrollments to users with global 'has_access'
-- =============================================

DO $$
DECLARE
    r_user RECORD;
    r_course RECORD;
BEGIN
    -- 1. For each student who currently has global access
    FOR r_user IN SELECT id FROM public.users WHERE has_access = true AND role = 'student'
    LOOP
        -- 2. Enroll them in every published course they are not already enrolled in
        FOR r_course IN SELECT id FROM public.courses WHERE is_published = true
        LOOP
            INSERT INTO public.enrollments (user_id, course_id)
            VALUES (r_user.id, r_course.id)
            ON CONFLICT (user_id, course_id) DO NOTHING;
        END LOOP;
        
        -- 3. Also grant them access to all published projects (if applicable)
        -- Note: using project_purchases table pattern
        FOR r_course IN SELECT id FROM public.projects WHERE is_published = true
        LOOP
            INSERT INTO public.project_purchases (user_id, project_id)
            VALUES (r_user.id, r_course.id)
            ON CONFLICT (user_id, project_id) DO NOTHING;
        END LOOP;
        
    END LOOP;
END $$;
