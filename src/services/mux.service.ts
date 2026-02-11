import { mux } from '../config/mux';
import type { MuxAsset } from '../types';

/**
 * Cria um asset Mux a partir de uma URL de vídeo
 */
export async function createMuxAssetFromUrl(videoUrl: string): Promise<MuxAsset | null> {
    if (!mux) {
        console.error('❌ Mux client não inicializado');
        return null;
    }
    try {
        const asset = await mux.video.assets.create({
            input: [{ url: videoUrl }],
            playback_policy: ['public'], // Playback público para testes
        });

        console.log('✅ Mux asset criado:', asset.id);

        return {
            id: asset.id!,
            playbackId: asset.playback_ids?.[0]?.id || '',
            status: asset.status!,
            duration: asset.duration
        };
    } catch (error) {
        console.error('❌ Erro ao criar Mux asset:', error);
        return null;
    }
}

/**
 * Cria uma URL de upload direto para o Mux
 */
export async function createMuxDirectUpload(): Promise<{ uploadUrl: string; assetId: string; uploadId: string } | null> {
    if (!mux) {
        console.error('❌ Mux client não inicializado');
        return null; // Return null explicitly if mux is missing
    }
    try {
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                playback_policy: ['public']
            },
            cors_origin: '*'
        });

        console.log('✅ Mux upload URL criada');

        return {
            uploadUrl: upload.url!,
            assetId: upload.asset_id || '', // Asset ID pode ser null na criação
            uploadId: upload.id // Retornar Upload ID garantido
        };
    } catch (error) {
        console.error('❌ Erro ao criar upload URL:', error);
        return null;
    }
}

/**
 * Cria uma live stream no Mux
 */
export async function createMuxLiveStream(title: string): Promise<{
    streamId: string;
    streamKey: string;
    playbackId: string;
} | null> {
    if (!mux) {
        console.error('❌ Mux client não inicializado');
        return null;
    }
    try {
        const liveStream = await mux.video.liveStreams.create({
            playback_policy: ['public'],
            new_asset_settings: {
                playback_policy: ['public']
            },
            reconnect_window: 60,
            latency_mode: 'low'
        });

        console.log('✅ Mux live stream criada:', liveStream.id);

        return {
            streamId: liveStream.id!,
            streamKey: liveStream.stream_key!,
            playbackId: liveStream.playback_ids?.[0]?.id || ''
        };
    } catch (error) {
        console.error('❌ Erro ao criar live stream:', error);
        return null;
    }
}

/**
 * Gera um token JWT para playback seguro
 */
export async function generatePlaybackToken(playbackId: string, type: 'video' | 'thumbnail' = 'video'): Promise<string | null> {
    if (!mux) {
        console.error('❌ Mux client não inicializado');
        return null;
    }
    try {
        const token = mux.jwt.signPlaybackId(playbackId, {
            type,
            expiration: '7d' // Token válido por 7 dias
        });

        return token;
    } catch (error) {
        console.error('❌ Erro ao gerar token de playback:', error);
        return null;
    }
}

/**
 * Deleta um asset do Mux
 */
export async function deleteMuxAsset(assetId: string): Promise<boolean> {
    if (!mux) return false;
    try {
        await mux.video.assets.delete(assetId);
        console.log('✅ Mux asset deletado:', assetId);
        return true;
    } catch (error) {
        console.error('❌ Erro ao deletar asset:', error);
        return false;
    }
}

export async function getMuxUpload(uploadId: string) {
    if (!mux) return null;
    try {
        const upload = await mux.video.uploads.retrieve(uploadId);
        return upload;
    } catch (error) {
        console.error('❌ Erro ao buscar upload:', error);
        return null;
    }
}

export async function getMuxAsset(assetId: string) {
    if (!mux) return null;
    try {
        const asset = await mux.video.assets.retrieve(assetId);
        return asset;
    } catch (error) {
        console.error('❌ Erro ao buscar asset:', error);
        return null;
    }
}
