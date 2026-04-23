import { Router } from 'express';
import { VoiceController } from '../controllers/voice.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/transcripts', VoiceController.createTranscript);
router.get('/transcripts/:interviewId', VoiceController.getTranscripts);
router.put('/transcripts/:id', VoiceController.updateTranscript);
router.get('/analysis/:interviewId', VoiceController.getAnalysis);
router.get('/metrics/:interviewId', VoiceController.getMetrics);
router.post('/transcribe', VoiceController.transcribeAudio);
router.post('/analyze/:interviewId', VoiceController.analyzeAudio);
router.post('/analysis/:interviewId', VoiceController.saveAnalysis);

export { router as voiceRoutes };
