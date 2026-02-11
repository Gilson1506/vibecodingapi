import { Router } from 'express';
import { toggleLessonCompletion, getCourseProgress } from '../controllers/progress.controller';

const router = Router();

router.post('/toggle', toggleLessonCompletion);
router.get('/:courseId/:userId', getCourseProgress);

export default router;
