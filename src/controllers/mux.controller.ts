import { Request, Response } from 'express';
import axios from 'axios';

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

// Mux API base URL
const MUX_API_BASE = 'https://api.mux.com';

// Create Mux authorization header
function getMuxAuth() {
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
        throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET must be configured');
    }
    return {
        username: MUX_TOKEN_ID,
        password: MUX_TOKEN_SECRET
    };
}

export const MuxController = {
    /**
     * Create a direct upload URL for Mux
     * Client will upload directly to Mux, avoiding server bottleneck
     */
    async createUploadUrl(req: Request, res: Response) {
        try {
            const { corsOrigin } = req.body;

            const response = await axios.post(
                `${MUX_API_BASE}/video/v1/uploads`,
                {
                    cors_origin: corsOrigin || '*',
                    new_asset_settings: {
                        playback_policy: ['public'],
                        encoding_tier: 'baseline' // Use 'smart' for better quality
                    }
                },
                {
                    auth: getMuxAuth()
                }
            );

            const upload = response.data.data;

            res.json({
                success: true,
                uploadId: upload.id,
                uploadUrl: upload.url,
                assetId: upload.asset_id // Will be null until upload completes
            });

        } catch (error: any) {
            console.error('Mux create upload error:', error.response?.data || error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to create upload URL'
            });
        }
    },

    /**
     * Get asset status (playback ID, etc.)
     */
    async getAssetStatus(req: Request, res: Response) {
        try {
            const { uploadId } = req.params;

            // First get the upload to find the asset ID
            const uploadResponse = await axios.get(
                `${MUX_API_BASE}/video/v1/uploads/${uploadId}`,
                { auth: getMuxAuth() }
            );

            const upload = uploadResponse.data.data;

            if (!upload.asset_id) {
                return res.json({
                    success: true,
                    status: upload.status,
                    message: 'Upload still processing'
                });
            }

            // Get asset details
            const assetResponse = await axios.get(
                `${MUX_API_BASE}/video/v1/assets/${upload.asset_id}`,
                { auth: getMuxAuth() }
            );

            const asset = assetResponse.data.data;
            const playbackId = asset.playback_ids?.[0]?.id;

            res.json({
                success: true,
                status: asset.status,
                assetId: asset.id,
                playbackId: playbackId,
                duration: asset.duration,
                aspectRatio: asset.aspect_ratio
            });

        } catch (error: any) {
            console.error('Mux get asset error:', error.response?.data || error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get asset status'
            });
        }
    },

    /**
     * Handle Mux webhook (optional - for real-time updates)
     */
    async handleWebhook(req: Request, res: Response) {
        try {
            const event = req.body;

            console.log('📹 Mux Webhook:', event.type);

            // Handle different event types
            switch (event.type) {
                case 'video.asset.ready':
                    console.log('✅ Asset ready:', event.data.id);
                    console.log('   Playback ID:', event.data.playback_ids?.[0]?.id);
                    break;

                case 'video.asset.errored':
                    console.log('❌ Asset error:', event.data.errors);
                    break;

                case 'video.upload.asset_created':
                    console.log('📤 Upload created asset:', event.data.asset_id);
                    break;
            }

            res.json({ received: true });

        } catch (error: any) {
            console.error('Mux webhook error:', error.message);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
};
