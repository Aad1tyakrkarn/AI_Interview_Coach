import { Router } from 'express';
import { ScoringController } from '../controllers/scoring.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/history', ScoringController.getHistory);
router.get('/comparison', ScoringController.getComparison);
router.post('/:interviewId/calculate', ScoringController.calculateScore);
router.get('/:interviewId', ScoringController.getByInterviewId);

export { router as scoringRoutes };
