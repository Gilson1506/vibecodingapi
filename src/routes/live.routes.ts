import { Router } from 'express';
import { createLiveStream, listLiveSessions, getLiveSession, deleteLiveSession } from '../controllers/live.controller';

const router = Router();

router.post('/create', createLiveStream);
router.get('/list', listLiveSessions);
router.get('/:id', getLiveSession);
router.delete('/:id', deleteLiveSession);

export default router;
