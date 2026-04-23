import { Router } from 'express';
import { AdminTicketsController } from '../../controllers/admin/tickets.controller';

const router = Router();

router.get('/', AdminTicketsController.list);
router.get('/:id', AdminTicketsController.getById);
router.patch('/:id', AdminTicketsController.update);
router.post('/:id/assign', AdminTicketsController.assign);
router.post('/:id/resolve', AdminTicketsController.resolve);
router.post('/:id/close', AdminTicketsController.close);

export { router as adminTicketsRoutes };
