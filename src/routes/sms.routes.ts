import { Router } from 'express';
import { sendSms, sendBulkSms, getSmsEvents } from '../controllers/sms.controller';

const router = Router();

// Send single SMS
router.post('/send', sendSms);

// Send bulk SMS (looping logic)
router.post('/send-bulk', sendBulkSms);

// Get SMS History
router.get('/history', getSmsEvents);

export default router;
