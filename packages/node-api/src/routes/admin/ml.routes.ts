import { Router } from 'express';
import { AdminMLController } from '../../controllers/admin/ml.controller';

const router = Router();

router.get('/models', AdminMLController.listModels);
router.get('/drift', AdminMLController.getDrift);
router.post('/retrain', AdminMLController.triggerRetrain);
router.post('/', AdminMLController.createModel);
router.get('/:id', AdminMLController.getModel);
router.post('/:id/deploy', AdminMLController.deployModel);
router.post('/:id/rollback', AdminMLController.rollbackModel);
router.get('/:id/metrics', AdminMLController.getModelMetrics);

export { router as adminMLRoutes };
