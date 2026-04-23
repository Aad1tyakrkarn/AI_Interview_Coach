import { Router } from 'express';
import { ReliabilityController } from '../controllers/reliability.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/autosave', ReliabilityController.autosave);
router.post('/heartbeat', ReliabilityController.heartbeat);
router.get('/connection-quality', ReliabilityController.getConnectionQuality);
router.post('/restore/:sessionId', ReliabilityController.restoreSession);
router.get('/restorable-sessions', ReliabilityController.getRestorableSessions);
router.get('/emergency-export/:interviewId', ReliabilityController.emergencyExport);

export { router as reliabilityRoutes };
