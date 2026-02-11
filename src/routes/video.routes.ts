import { Router } from 'express';
import {
    createUploadUrl,
    createLive,
    getPlaybackToken,
    syncMuxStatus
} from '../controllers/video.controller';

const router = Router();

// Gerar URL de upload direto
router.post('/upload-url', createUploadUrl);

// Criar live stream
router.post('/create-live', createLive);

// Obter token de playback
// Obter token de playback
router.get('/playback-token/:playbackId', getPlaybackToken);

// Sincronizar status
router.post('/sync/:uploadId', syncMuxStatus);

export default router;
