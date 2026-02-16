-- =============================================
-- Function to get all published courses with enrollment status for a student
-- =============================================

CREATE OR REPLACE FUNCTION get_all_courses_with_access(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_courses JSONB;
BEGIN
    SELECT json_agg(t) INTO v_courses
    FROM (
        SELECT 
            c.id,
            c.title,
            c.description,
            c.cover_url,
            c.price_cents,
            c.is_published,
            c.created_at,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
            (
                EXISTS (
                    SELECT 1 FROM public.enrollments e 
                    WHERE e.course_id = c.id AND e.user_id = p_user_id
                ) 
                OR 
                EXISTS (
                    SELECT 1 FROM public.users u 
                    WHERE u.id = p_user_id AND u.role = 'admin'
                )
            ) as is_enrolled,
            p_user_id as check_user_id
        FROM public.courses c
        WHERE c.is_published = true
        ORDER BY c.created_at DESC
    ) t;
    
    RETURN COALESCE(v_courses, '[]'::jsonb);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_all_courses_with_access TO authenticated;
