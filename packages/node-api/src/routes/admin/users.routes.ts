import { Router } from 'express';
import { AdminUsersController } from '../../controllers/admin/users.controller';

const router = Router();

router.get('/', AdminUsersController.list);
router.get('/analytics', AdminUsersController.getAnalytics);
router.get('/:id', AdminUsersController.getById);
router.patch('/:id', AdminUsersController.update);
router.delete('/:id', AdminUsersController.delete);
router.post('/:id/suspend', AdminUsersController.suspend);
router.post('/:id/activate', AdminUsersController.activate);

export { router as adminUsersRoutes };
