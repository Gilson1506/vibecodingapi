import { Router } from 'express';
import { getUserStats, updateUserProfile } from '../controllers/user.controller';

const router = Router();

router.get('/stats/:userId', getUserStats);
router.put('/:userId', updateUserProfile);

export default router;
