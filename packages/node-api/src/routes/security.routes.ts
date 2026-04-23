import { Router } from 'express';
import { SecurityController } from '../controllers/security.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no auth required)
router.get('/ethical-ai', SecurityController.getEthicalAI);
router.get('/hiring-disclaimer', SecurityController.getHiringDisclaimer);

// Authenticated routes
router.use(authMiddleware);

router.post('/consent', SecurityController.submitConsent);
router.get('/consent', SecurityController.getConsent);
router.post('/data-deletion', SecurityController.requestDataDeletion);
router.get('/audit-logs', SecurityController.getAuditLogs);
router.get('/privacy-policy', SecurityController.getPrivacyPolicy);
router.post('/privacy-policy/accept', SecurityController.acceptPrivacyPolicy);
router.get('/privacy-policy/status', SecurityController.checkPrivacyPolicy);

export { router as securityRoutes };
