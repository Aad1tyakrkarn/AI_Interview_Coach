import { Router } from 'express';
import { CameraController } from '../controllers/camera.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/analyze-frames/:interviewId', CameraController.analyzeFrames);
router.post('/quality', CameraController.checkQuality);
router.post('/analysis', CameraController.createAnalysis);
router.get('/analysis/:interviewId', CameraController.getAnalysis);
router.post('/consent', CameraController.submitConsent);
router.get('/consent/:interviewId', CameraController.getConsent);

export { router as cameraRoutes };
