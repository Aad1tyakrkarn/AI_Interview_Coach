import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { adminUsersRoutes } from './users.routes';
import { adminQuestionsRoutes } from './questions.routes';
import { adminInterviewsRoutes } from './interviews.routes';
import { adminSystemRoutes } from './system.routes';
import { adminMLRoutes } from './ml.routes';
import { adminTicketsRoutes } from './tickets.routes';
import { adminFeedbackRoutes } from './feedback.routes';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

router.use('/users', adminUsersRoutes);
router.use('/questions', adminQuestionsRoutes);
router.use('/interviews', adminInterviewsRoutes);
router.use('/system', adminSystemRoutes);
router.use('/ml', adminMLRoutes);
router.use('/tickets', adminTicketsRoutes);
router.use('/feedback', adminFeedbackRoutes);

export { router as adminRoutes };
