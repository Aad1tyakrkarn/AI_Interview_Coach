import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/2fa/setup', authMiddleware, AuthController.setup2FA);
router.post('/2fa/verify', authMiddleware, AuthController.verify2FA);
router.post('/2fa/disable', authMiddleware, AuthController.disable2FA);
router.post('/resend-verification', authRateLimiter, AuthController.resendVerification);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.delete('/sessions/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const { prisma } = await import('../config/database');
    const userId = (req as any).userId;
    const currentSessionId = (req as any).sessionId;
    if (currentSessionId && req.params.sessionId === currentSessionId) {
      res.status(400).json({
        error: { message: 'Cannot revoke the current session. Use logout instead.' },
      });
      return;
    }
    const result = await prisma.session.deleteMany({
      where: { id: req.params.sessionId, userId },
    });
    if (result.count === 0) {
      res.status(404).json({ error: { message: 'Session not found' } });
      return;
    }
    res.json({ message: 'Session revoked' });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
