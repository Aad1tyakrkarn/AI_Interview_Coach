import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Model version management
router.get('/models', EvaluationController.getModelVersions);
router.post('/models', EvaluationController.trackModelVersion);

// Evaluation endpoints
router.post('/:interviewId/evaluate', EvaluationController.evaluateAnswer);
router.get('/:interviewId', EvaluationController.getByInterviewId);
router.get('/:interviewId/questions/:questionId', EvaluationController.getByQuestion);
router.get('/:interviewId/explainability', EvaluationController.getExplainability);

export { router as evaluationRoutes };
