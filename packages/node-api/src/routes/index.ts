import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { resumeRoutes } from './resume.routes';
import { interviewRoutes } from './interview.routes';
import { questionRoutes } from './question.routes';
import { voiceRoutes } from './voice.routes';
import { cameraRoutes } from './camera.routes';
import { evaluationRoutes } from './evaluation.routes';
import { scoringRoutes } from './scoring.routes';
import { reportRoutes } from './report.routes';
import { reliabilityRoutes } from './reliability.routes';
import { securityRoutes } from './security.routes';
import { aiInterviewerRoutes } from './ai-interviewer.routes';
import { adminRoutes } from './admin';
import { generalRateLimiter, interviewRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Apply general rate limiter to all routes
router.use(generalRateLimiter);

// Public & authenticated routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/resumes', resumeRoutes);
router.use('/interviews', interviewRateLimiter, interviewRoutes);
router.use('/questions', questionRoutes);
router.use('/voice', voiceRoutes);
router.use('/camera', cameraRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/scoring', scoringRoutes);
router.use('/reports', reportRoutes);
router.use('/reliability', reliabilityRoutes);
router.use('/security', securityRoutes);
router.use('/ai-interviewer', interviewRateLimiter, aiInterviewerRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export { router as routes };
