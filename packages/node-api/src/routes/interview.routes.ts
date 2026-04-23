import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', InterviewController.create);
router.get('/', InterviewController.list);
router.get('/:id', InterviewController.getById);
router.patch('/:id', InterviewController.update);
router.delete('/:id', InterviewController.delete);
router.post('/:id/start', InterviewController.start);
router.post('/:id/pause', InterviewController.pause);
router.post('/:id/resume', InterviewController.resume);
router.post('/:id/end', InterviewController.end);
router.post('/:id/answer', InterviewController.submitAnswer);
router.post('/:id/skip', InterviewController.skip);
router.get('/:id/hints', InterviewController.getHints);
router.get('/:id/comparison', InterviewController.getComparison);

export { router as interviewRoutes };
