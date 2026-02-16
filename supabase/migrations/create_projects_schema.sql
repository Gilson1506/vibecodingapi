-- =============================================
-- Projects Module Schema
-- =============================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price_cents INT NOT NULL DEFAULT 0,
    cover_url TEXT,
    is_published BOOLEAN DEFAULT false,
    details_json JSONB DEFAULT '{}'::jsonb, -- Store rich description/markdown
    previews JSONB DEFAULT '[]'::jsonb,   -- Array of { label: string, url: string }
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Project Files Table (Documentation/Assets available after purchase)
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- 'pdf', 'zip', 'link', etc.
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Project Purchases Table
CREATE TABLE IF NOT EXISTS project_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(is_published, order_index);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_project_purchases_user_id ON project_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_project_purchases_project_id ON project_purchases(project_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_purchases ENABLE ROW LEVEL SECURITY;

-- Projects: Everyone can view published ones, admins can do anything
DROP POLICY IF EXISTS "Public can view published projects" ON projects;
CREATE POLICY "Public can view published projects" ON projects
    FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
CREATE POLICY "Admins can manage projects" ON projects
    FOR ALL USING (public.is_admin());

-- Project Files: Only purchased users or admins can view
DROP POLICY IF EXISTS "Purchasers can view project files" ON project_files;
CREATE POLICY "Purchasers can view project files" ON project_files
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_purchases WHERE project_id = project_files.project_id AND user_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can manage project files" ON project_files;
CREATE POLICY "Admins can manage project files" ON project_files
    FOR ALL USING (public.is_admin());

-- Project Purchases: Users can only see their own, admins see all
DROP POLICY IF EXISTS "Users can view own purchases" ON project_purchases;
CREATE POLICY "Users can view own purchases" ON project_purchases
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage purchases" ON project_purchases;
CREATE POLICY "Admins can manage purchases" ON project_purchases
    FOR ALL USING (public.is_admin());

-- =============================================
-- RPC Functions
-- =============================================

-- Get Projects for Student with Purchase Status
CREATE OR REPLACE FUNCTION get_projects_for_student(
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
    v_data JSON;
BEGIN
    v_offset := (p_page - 1) * p_per_page;
    
    -- Get total count
    SELECT COUNT(*) INTO v_total
    FROM projects
    WHERE is_published = true;
    
    -- Get paginated data
    SELECT json_agg(row_to_json(t)) INTO v_data
    FROM (
        SELECT 
            p.id,
            p.title,
            p.description,
            p.price_cents,
            p.cover_url,
            p.previews,
            EXISTS (
                SELECT 1 FROM project_purchases pp 
                WHERE pp.project_id = p.id AND pp.user_id = p_user_id
            ) as is_purchased
        FROM projects p
        WHERE p.is_published = true
        ORDER BY p.order_index, p.created_at DESC
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

-- Get Project Details with Files
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
    ) OR (auth.jwt() ->> 'role') = 'admin' INTO v_is_purchased;

    SELECT row_to_json(t) INTO v_project
    FROM (
        SELECT 
            p.id,
            p.title,
            p.description,
            p.price_cents,
            p.cover_url,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_projects_for_student TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_details TO authenticated;
GRANT ALL ON projects TO service_role;
GRANT ALL ON project_files TO service_role;
GRANT ALL ON project_purchases TO service_role;
