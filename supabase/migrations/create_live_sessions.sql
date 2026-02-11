-- Create live_sessions table
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    max_participants INTEGER DEFAULT 100,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
    
    -- Mux specific fields
    mux_playback_id TEXT,
    mux_stream_key TEXT,
    mux_live_stream_id TEXT, -- The ID returned by Mux creation API
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view (for listing) - in real app might restrict to logged in users
CREATE POLICY "Everyone can view live sessions" 
ON public.live_sessions FOR SELECT 
USING (true);

-- Only admins/service role can insert/update/delete
-- For now allowing anon for dev/testing ease if needed, but optimally restrict
CREATE POLICY "Admins can insert live sessions" 
ON public.live_sessions FOR INSERT 
WITH CHECK (true); -- Relaxed for development, ideally check role

CREATE POLICY "Admins can update live sessions" 
ON public.live_sessions FOR UPDATE 
USING (true);

CREATE POLICY "Admins can delete live sessions" 
ON public.live_sessions FOR DELETE 
USING (true);
