import { Router } from 'express';
import { AdminFeedbackController } from '../../controllers/admin/feedback.controller';

const router = Router();

router.get('/', AdminFeedbackController.list);
router.get('/stats', AdminFeedbackController.getStats);
router.get('/:id', AdminFeedbackController.getById);
router.post('/:id/respond', AdminFeedbackController.respond);

export { router as adminFeedbackRoutes };
