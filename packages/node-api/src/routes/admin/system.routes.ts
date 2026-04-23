import { Router } from 'express';
import { AdminSystemController } from '../../controllers/admin/system.controller';

const router = Router();

router.get('/health', AdminSystemController.getHealth);
router.get('/analytics', AdminSystemController.getAnalytics);
router.get('/peak-usage', AdminSystemController.getPeakUsage);
router.get('/api-usage', AdminSystemController.getApiUsage);
router.get('/storage', AdminSystemController.getStorage);
router.get('/metrics', AdminSystemController.getMetrics);
router.get('/logs', AdminSystemController.getLogs);
router.get('/config', AdminSystemController.getConfig);
router.put('/config', AdminSystemController.updateConfig);

export { router as adminSystemRoutes };
