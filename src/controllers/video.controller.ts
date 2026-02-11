import { Request, Response } from 'express';
import { createMuxDirectUpload, createMuxLiveStream, generatePlaybackToken, getMuxUpload, getMuxAsset } from '../services/mux.service';
import { supabase } from '../config/supabase';

/**
 * Gera URL de upload direto para o Mux
 */
export async function createUploadUrl(req: Request, res: Response) {
    try {
        const { lessonId } = req.body;

        // Criar upload URL no Mux
        const uploadData = await createMuxDirectUpload();

        if (!uploadData) {
            return res.status(500).json({ error: 'Erro ao criar upload URL' });
        }

        // Se lessonId for fornecido, atualiza a aula (caso já exista)
        if (lessonId) {
            await supabase
                .from('lessons')
                .update({
                    mux_asset_id: uploadData.assetId,
                    mux_status: 'pending'
                })
                .eq('id', lessonId);
        }

        res.json({
            success: true,
            uploadUrl: uploadData.uploadUrl,
            assetId: uploadData.assetId,
            uploadId: uploadData.uploadId
        });
    } catch (error) {
        console.error('Erro em createUploadUrl:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

/**
 * Cria uma live stream no Mux
 */
export async function createLive(req: Request, res: Response) {
    try {
        const { title, liveSessionId } = req.body;

        if (!title || !liveSessionId) {
            return res.status(400).json({ error: 'title e liveSessionId são obrigatórios' });
        }

        // Criar live stream no Mux
        const liveData = await createMuxLiveStream(title);

        if (!liveData) {
            return res.status(500).json({ error: 'Erro ao criar live stream' });
        }

        // Atualizar live_session
        await supabase
            .from('live_sessions')
            .update({
                mux_live_stream_id: liveData.streamId,
                mux_stream_key: liveData.streamKey,
                mux_playback_id: liveData.playbackId,
                status: 'idle'
            })
            .eq('id', liveSessionId);

        res.json({
            success: true,
            streamId: liveData.streamId,
            streamKey: liveData.streamKey,
            playbackId: liveData.playbackId,
            rtmpUrl: 'rtmps://global-live.mux.com:443/app'
        });
    } catch (error) {
        console.error('Erro em createLive:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

/**
 * Gera token JWT para playback seguro
 */
export async function getPlaybackToken(req: Request, res: Response) {
    try {
        const { playbackId } = req.params;
        const { type = 'video' } = req.query;

        if (!playbackId) {
            return res.status(400).json({ error: 'playbackId é obrigatório' });
        }

        const token = await generatePlaybackToken(playbackId, type as 'video' | 'thumbnail');

        if (!token) {
            return res.status(500).json({ error: 'Erro ao gerar token' });
        }

        res.json({
            success: true,
            token,
            playbackId
        });
    } catch (error) {
        console.error('Erro em getPlaybackToken:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

/**
 * Sincroniza status do Mux (Fix Race Condition)
 */
export async function syncMuxStatus(req: Request, res: Response) {
    try {
        const { uploadId } = req.params;
        console.log('🔄 Sincronizando Upload ID:', uploadId);

        const upload = await getMuxUpload(uploadId);

        if (!upload || !upload.asset_id) {
            return res.status(404).json({ error: 'Asset ainda não gerado pelo Mux' });
        }

        const asset = await getMuxAsset(upload.asset_id);
        if (!asset) {
            return res.status(404).json({ error: 'Asset não encontrado' });
        }

        const playbackId = asset.playback_ids?.[0]?.id;

        // Update DB
        const { error } = await supabase
            .from('lessons')
            .update({
                mux_status: asset.status,
                mux_asset_id: asset.id, // ID real
                mux_playback_id: playbackId,
                duration_seconds: Math.floor(asset.duration || 0)
            })
            .eq('mux_asset_id', uploadId); // Busca pelo Upload ID que está salvo no banco

        if (error) throw error;

        res.json({ success: true, status: asset.status, playbackId });

    } catch (error) {
        console.error('Erro em syncMuxStatus:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
}
