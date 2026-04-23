import { Router } from 'express';
import { AdminQuestionsController } from '../../controllers/admin/questions.controller';

const router = Router();

router.get('/', AdminQuestionsController.list);
router.post('/', AdminQuestionsController.create);
router.get('/analytics', AdminQuestionsController.getAnalytics);
router.post('/bulk-import', AdminQuestionsController.bulkImport);
router.get('/:id', AdminQuestionsController.getById);
router.put('/:id', AdminQuestionsController.update);
router.delete('/:id', AdminQuestionsController.delete);

export { router as adminQuestionsRoutes };
