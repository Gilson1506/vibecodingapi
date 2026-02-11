-- Create notifications table for storing user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'success', 'warning', 'info', 'error'
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Only system/admin can insert notifications (via service role)
CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;

-- RPC function to get user notifications with unread count
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    time_ago TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.read,
        n.created_at,
        CASE 
            WHEN n.created_at > NOW() - INTERVAL '1 minute' THEN 'Agora'
            WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN 
                EXTRACT(MINUTE FROM NOW() - n.created_at)::INT || ' min atrás'
            WHEN n.created_at > NOW() - INTERVAL '1 day' THEN 
                EXTRACT(HOUR FROM NOW() - n.created_at)::INT || ' hora(s) atrás'
            WHEN n.created_at > NOW() - INTERVAL '7 days' THEN 
                EXTRACT(DAY FROM NOW() - n.created_at)::INT || ' dia(s) atrás'
            ELSE TO_CHAR(n.created_at, 'DD/MM/YYYY')
        END AS time_ago
    FROM notifications n
    WHERE n.user_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$;

-- RPC function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count_val INT;
BEGIN
    SELECT COUNT(*) INTO count_val
    FROM notifications
    WHERE user_id = auth.uid() AND read = false;
    
    RETURN count_val;
END;
$$;

-- RPC function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET read = true, updated_at = NOW()
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- RPC function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INT;
BEGIN
    UPDATE notifications
    SET read = true, updated_at = NOW()
    WHERE user_id = auth.uid() AND read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notifications_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;

-- Insert welcome notification for existing users (optional - run once)
-- INSERT INTO notifications (user_id, title, message, type, read)
-- SELECT id, 'Bem-vindo ao E-Vibe Coding!', 'Sua jornada de aprendizado começa agora. Explore os cursos disponíveis!', 'success', false
-- FROM users WHERE role = 'student';
