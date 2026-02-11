import { Router } from 'express';
import { sendManualEmail, sendBulkEmail } from '../controllers/email.controller';

const router = Router();

// Enviar email manual
router.post('/send', sendManualEmail);

// Enviar email em massa
router.post('/send-bulk', sendBulkEmail);

export default router;
