import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/trends', ReportController.getTrends);
router.get('/readiness', ReportController.getReadiness);
router.get('/recommendations', ReportController.getRecommendations);
router.get('/history', ReportController.getHistory);
router.get('/:interviewId', ReportController.getByInterviewId);
router.post('/:interviewId/generate', ReportController.generateReport);
router.get('/:interviewId/pdf', ReportController.getPdf);

export { router as reportRoutes };
