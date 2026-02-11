import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import Mux from '@mux/mux-node';

// Initialize Mux client
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET
});

export const createLiveStream = async (req: Request, res: Response) => {
    try {
        const { title, description, scheduledAt, maxParticipants, durationMinutes } = req.body;

        if (!title || !scheduledAt) {
            return res.status(400).json({ error: 'Title and Scheduled Date are required' });
        }

        console.log(`Creating Mux Live Stream for: ${title}`);

        // 1. Create Live Stream in Mux
        const stream = await mux.video.liveStreams.create({
            playback_policy: ['public'],
            new_asset_settings: { playback_policy: ['public'] },
            reconnect_window: 60, // 60 seconds to reconnect if disconnected
        });

        console.log('Mux Stream Created:', stream.id);

        // 2. Save to Supabase
        const { data, error } = await supabase
            .from('live_sessions')
            .insert({
                title,
                description,
                scheduled_at: scheduledAt,
                max_participants: maxParticipants || 100,
                duration_minutes: durationMinutes || 60,
                status: 'scheduled',
                mux_live_stream_id: stream.id,
                mux_stream_key: stream.stream_key,
                mux_playback_id: stream.playback_ids?.[0]?.id,
                rtmp_url: 'rtmps://global-live.mux.com:443/app', // Default Mux RTMPS URL
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        return res.status(201).json(data);

    } catch (error: any) {
        console.error('Error creating live stream:', error);
        return res.status(500).json({
            error: 'Failed to create live stream',
            details: error.message || error
        });
    }
};

export const listLiveSessions = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('live_sessions')
            .select('*')
            .order('scheduled_at', { ascending: true });

        if (error) throw error;

        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Error fetching live sessions:', error);
        return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};

export const getLiveSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('live_sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Optionally fetch Mux status to sync
        if (data.mux_live_stream_id) {
            try {
                const muxStream = await mux.video.liveStreams.retrieve(data.mux_live_stream_id);
                // Update status if it changed (basic sync)
                // In production, webhooks are better for this
                const mapStatus = (muxStatus: string) => {
                    if (muxStatus === 'active') return 'live';
                    if (muxStatus === 'idle') {
                        // If it was already live and went idle, it might be ended, or just paused. 
                        // For simplicity let's keep it as is or handle via logic.
                        // But if we just look at Mux status: 'idle' is the default 'scheduled' state too?
                        // Actually Mux 'status' is 'idle', 'active', 'disabled'.
                        return 'scheduled'; // Simplifying map. Database 'status' has 'scheduled', 'live', 'ended'
                    }
                    return 'scheduled';
                };

                // Only return the mux status for the frontend UI to know real connectivity
                // We don't necessarily update DB here to avoid race conditions with webhooks
                return res.status(200).json({ ...data, mux_status: muxStream.status });

            } catch (muxErr) {
                console.error("Error fetching Mux status", muxErr);
            }
        }

        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Error fetching live session:', error);
        return res.status(500).json({ error: 'Failed to fetch session' });
    }
};

export const deleteLiveSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Get Session to find Mux ID
        const { data: session } = await supabase
            .from('live_sessions')
            .select('mux_live_stream_id')
            .eq('id', id)
            .single();

        if (session?.mux_live_stream_id) {
            // 2. Delete from Mux (Best effort)
            try {
                await mux.video.liveStreams.delete(session.mux_live_stream_id);
            } catch (err) {
                console.error("Mux delete error (ignoring):", err);
            }
        }

        // 3. Delete from Supabase
        const { error } = await supabase
            .from('live_sessions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return res.status(200).json({ message: 'Session deleted' });

    } catch (error: any) {
        console.error('Error deleting session:', error);
        return res.status(500).json({ error: 'Failed to delete session' });
    }
}
