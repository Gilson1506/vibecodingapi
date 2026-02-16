-- Add images_urls to projects table for carousel support
ALTER TABLE projects ADD COLUMN IF NOT EXISTS images_urls JSONB DEFAULT '[]'::jsonb;

-- Update get_projects_for_student to include images_urls (optional for list, but good for detail)
-- Actually, the detail page uses get_project_details which selects * from projects or specific columns.

-- Update get_project_details to include images_urls
CREATE OR REPLACE FUNCTION get_project_details(
    p_project_id UUID,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project JSON;
    v_is_purchased BOOLEAN;
BEGIN
    -- Check purchase status
    SELECT EXISTS (
        SELECT 1 FROM project_purchases 
        WHERE project_id = p_project_id AND user_id = p_user_id
    ) OR public.is_admin() INTO v_is_purchased;

    SELECT row_to_json(t) INTO v_project
    FROM (
        SELECT 
            p.id,
            p.title,
            p.description,
            p.price_cents,
            p.cover_url,
            p.images_urls, -- Added this line
            p.details_json,
            p.previews,
            v_is_purchased as is_purchased,
            (
                SELECT json_agg(row_to_json(f))
                FROM (
                    SELECT id, name, file_url, file_type
                    FROM project_files
                    WHERE project_id = p.id
                    ORDER BY order_index, created_at
                ) f
            ) as files
        FROM projects p
        WHERE p.id = p_project_id
    ) t;

    RETURN v_project;
END;
$$;
