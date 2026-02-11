import { Router } from 'express';
import { MuxController } from '../controllers/mux.controller';

const router = Router();

// Create direct upload URL
router.post('/upload-url', MuxController.createUploadUrl);

// Get asset status by upload ID
router.get('/asset/:uploadId', MuxController.getAssetStatus);

// Webhook from Mux
router.post('/webhook', MuxController.handleWebhook);

export default router;
