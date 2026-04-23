import { Router } from 'express';
import { AdminInterviewsController } from '../../controllers/admin/interviews.controller';

const router = Router();

router.get('/', AdminInterviewsController.list);
router.get('/active', AdminInterviewsController.getActive);
router.get('/analytics', AdminInterviewsController.getStats);
router.get('/:id', AdminInterviewsController.getById);
router.patch('/:id', AdminInterviewsController.update);
router.delete('/:id', AdminInterviewsController.delete);

export { router as adminInterviewsRoutes };
