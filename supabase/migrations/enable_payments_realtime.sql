-- Enable Realtime on payments table for instant status updates
-- This allows the checkout to receive updates immediately when a payment is confirmed

-- 1. Enable Realtime for the payments table
ALTER publication supabase_realtime ADD TABLE payments;

-- 2. Create index for faster filtering by payment id
CREATE INDEX IF NOT EXISTS idx_payments_id ON payments(id);

-- 3. Grant select permission to authenticated and anon users for realtime
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON payments TO anon;

-- 4. Enable RLS policy for payments (if not already enabled)
-- Allow users to see payments (needed for realtime subscription)
DO $$
BEGIN
    -- Check if policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'payments' 
        AND policyname = 'allow_select_payments_by_id'
    ) THEN
        CREATE POLICY allow_select_payments_by_id ON payments
            FOR SELECT
            USING (true); -- Allow reading any payment (filtered by id in subscription)
    END IF;
END $$;
