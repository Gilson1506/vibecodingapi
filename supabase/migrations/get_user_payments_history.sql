-- =============================================
-- Function to get user payment history with item titles
-- =============================================

CREATE OR REPLACE FUNCTION get_user_payments_history(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_history JSONB;
BEGIN
    SELECT json_agg(t) INTO v_history
    FROM (
        SELECT 
            p.id,
            p.amount_cents,
            p.status,
            p.payment_method,
            p.created_at,
            p.paid_at,
            p.metadata,
            CASE 
                WHEN (p.metadata->>'type') = 'course' THEN (
                    SELECT title FROM courses WHERE id = (p.metadata->>'courseId')::UUID
                )
                WHEN (p.metadata->>'type') = 'project' THEN (
                    SELECT title FROM projects WHERE id = (p.metadata->>'projectId')::UUID
                )
                ELSE 'Compra Geral'
            END as item_title
        FROM payments p
        WHERE p.user_id = p_user_id
        ORDER BY p.created_at DESC
    ) t;
    
    RETURN COALESCE(v_history, '[]'::jsonb);
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_payments_history TO authenticated;
