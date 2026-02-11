import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

router.post('/create', PaymentController.createPayment);
router.get('/status/:id', PaymentController.getPaymentStatus);
router.get('/subscribe/:id', PaymentController.subscribeToPaymentStatus); // SSE endpoint
router.post('/webhook/appypay', PaymentController.handleWebhook);

export default router;
