import { Router } from 'express';
import { AIInterviewerController } from '../controllers/ai-interviewer.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/:interviewId/generate-question', AIInterviewerController.generateQuestion);
router.post('/:interviewId/generate-dynamic', AIInterviewerController.generateDynamicQuestion);
router.post('/:interviewId/follow-up', AIInterviewerController.generateFollowUp);
router.post('/:interviewId/adapt-difficulty', AIInterviewerController.adaptDifficulty);
router.post('/:interviewId/silence', AIInterviewerController.handleSilence);
router.post('/:interviewId/closing', AIInterviewerController.getClosingMessage);
router.post('/:interviewId/acknowledge', AIInterviewerController.getAcknowledgement);
router.post('/:interviewId/encouragement', AIInterviewerController.getEncouragement);
router.post('/:interviewId/intro', AIInterviewerController.generateIntro);
router.post('/:interviewId/coaching-feedback', AIInterviewerController.getCoachingFeedback);
router.post('/:interviewId/answer-feedback', AIInterviewerController.getAnswerFeedback);
router.post('/:interviewId/resume-question', AIInterviewerController.generateResumeQuestion);
router.post('/rephrase', AIInterviewerController.rephraseQuestion);
router.post('/skip-ack', AIInterviewerController.getSkipAcknowledgement);

export { router as aiInterviewerRoutes };
