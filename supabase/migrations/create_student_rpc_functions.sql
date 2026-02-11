-- =============================================
-- RPC Functions for Student Dashboard with Pagination
-- =============================================

-- 1. Get Materials with Pagination
CREATE OR REPLACE FUNCTION get_materials_paginated(
  p_category_id UUID DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 12
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_data JSON;
BEGIN
  v_offset := (p_page - 1) * p_per_page;
  
  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM materials m
  WHERE (p_category_id IS NULL OR m.category_id = p_category_id);
  
  -- Get paginated data
  SELECT json_agg(row_to_json(t)) INTO v_data
  FROM (
    SELECT 
      m.id,
      m.title,
      m.type,
      m.file_size,
      m.file_url,
      m.created_at,
      c.name as category_name,
      c.id as category_id
    FROM materials m
    LEFT JOIN categories c ON c.id = m.category_id
    WHERE (p_category_id IS NULL OR m.category_id = p_category_id)
    ORDER BY m.created_at DESC
    LIMIT p_per_page
    OFFSET v_offset
  ) t;
  
  RETURN json_build_object(
    'data', COALESCE(v_data, '[]'::json),
    'pagination', json_build_object(
      'page', p_page,
      'per_page', p_per_page,
      'total', v_total,
      'total_pages', CEIL(v_total::FLOAT / p_per_page)
    )
  );
END;
$$;

-- 2. Get Material Categories
CREATE OR REPLACE FUNCTION get_material_categories()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT DISTINCT c.id, c.name
      FROM categories c
      INNER JOIN materials m ON m.category_id = c.id
      ORDER BY c.name
    ) t
  );
END;
$$;

-- 3. Get Tools with Categories and Pagination
CREATE OR REPLACE FUNCTION get_tools_with_categories(
  p_category_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 12
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_tools JSON;
  v_categories JSON;
BEGIN
  v_offset := (p_page - 1) * p_per_page;
  
  -- Get categories for tools
  SELECT json_agg(row_to_json(cat)) INTO v_categories
  FROM (
    SELECT id, name, type
    FROM categories
    WHERE type = 'tools'
    ORDER BY order_index, name
  ) cat;
  
  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM tools t
  WHERE t.is_available = true
    AND (p_category_id IS NULL OR t.category_id = p_category_id)
    AND (p_search IS NULL OR t.name ILIKE '%' || p_search || '%' OR t.description ILIKE '%' || p_search || '%');
  
  -- Get paginated tools with orientation files
  SELECT json_agg(row_to_json(tool_data)) INTO v_tools
  FROM (
    SELECT 
      t.id,
      t.category_id,
      t.name,
      t.type,
      t.description,
      t.url,
      t.is_available as available,
      t.cover_url as image,
      t.orientation_text,
      (
        SELECT json_agg(json_build_object(
          'id', f.id,
          'name', f.name,
          'type', f.file_type,
          'url', f.file_url
        ))
        FROM tool_orientation_files f
        WHERE f.tool_id = t.id
      ) as orientation_files
    FROM tools t
    WHERE t.is_available = true
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
      AND (p_search IS NULL OR t.name ILIKE '%' || p_search || '%' OR t.description ILIKE '%' || p_search || '%')
    ORDER BY t.order_index, t.name
    LIMIT p_per_page
    OFFSET v_offset
  ) tool_data;
  
  RETURN json_build_object(
    'categories', COALESCE(v_categories, '[]'::json),
    'tools', COALESCE(v_tools, '[]'::json),
    'pagination', json_build_object(
      'page', p_page,
      'per_page', p_per_page,
      'total', v_total,
      'total_pages', CEIL(v_total::FLOAT / p_per_page)
    )
  );
END;
$$;

-- 4. Get Student Courses with Progress and Pagination
CREATE OR REPLACE FUNCTION get_student_courses(
  p_user_id UUID,
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 12
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_courses JSON;
BEGIN
  v_offset := (p_page - 1) * p_per_page;
  
  -- Get total enrolled courses
  SELECT COUNT(DISTINCT c.id) INTO v_total
  FROM courses c
  INNER JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id
  WHERE c.is_published = true;
  
  -- Get paginated courses with progress
  SELECT json_agg(row_to_json(course_data)) INTO v_courses
  FROM (
    SELECT 
      c.id,
      c.title,
      c.description,
      c.cover_url as thumbnail,
      c.price_cents,
      (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
      (SELECT COALESCE(SUM(duration_minutes), 0) FROM lessons WHERE course_id = c.id) as total_duration_minutes,
      COALESCE(
        (
          SELECT ROUND(
            (COUNT(*) FILTER (WHERE lp.completed = true)::FLOAT / NULLIF(COUNT(*), 0)) * 100
          )
          FROM lessons l
          LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = p_user_id
          WHERE l.course_id = c.id
        ),
        0
      ) as progress,
      (
        SELECT l.id
        FROM lessons l
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = p_user_id
        WHERE l.course_id = c.id
          AND (lp.completed IS NULL OR lp.completed = false)
        ORDER BY l.order_index
        LIMIT 1
      ) as next_lesson_id
    FROM courses c
    INNER JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id
    WHERE c.is_published = true
    ORDER BY e.created_at DESC
    LIMIT p_per_page
    OFFSET v_offset
  ) course_data;
  
  RETURN json_build_object(
    'data', COALESCE(v_courses, '[]'::json),
    'pagination', json_build_object(
      'page', p_page,
      'per_page', p_per_page,
      'total', v_total,
      'total_pages', CEIL(v_total::FLOAT / p_per_page)
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_materials_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION get_material_categories TO authenticated;
GRANT EXECUTE ON FUNCTION get_tools_with_categories TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_courses TO authenticated;
