import { Router } from 'express';
import { ResumeController } from '../controllers/resume.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadResume } from '../middleware/upload.middleware';
import { uploadRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/upload', uploadRateLimiter, uploadResume, ResumeController.upload);
router.get('/', ResumeController.list);
router.get('/:id', ResumeController.getById);
router.get('/:id/parsed', ResumeController.getParsedData);
router.post('/:id/reparse', ResumeController.reparse);
router.put('/:id', ResumeController.update);
router.delete('/:id', ResumeController.delete);

export { router as resumeRoutes };
