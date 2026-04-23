import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', QuestionController.list);
router.get('/categories', QuestionController.getCategories);
router.get('/by-role/:roleId', QuestionController.getByRole);
router.get('/:id', QuestionController.getById);

export { router as questionRoutes };
