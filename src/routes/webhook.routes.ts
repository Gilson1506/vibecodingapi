import { Router } from 'express';
import {
    handleAppyPayWebhook,
    handleMuxWebhook
} from '../controllers/webhook.controller';

const router = Router();

// Webhook do Appy Pay (confirmação de pagamento)
router.post('/appypay', handleAppyPayWebhook);

// Webhook do Mux (status de assets e lives)
router.post('/mux', handleMuxWebhook);

export default router;
