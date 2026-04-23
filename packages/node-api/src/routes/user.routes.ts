import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadAvatar } from '../middleware/upload.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/me', UserController.getProfile);
router.patch('/me', UserController.updateProfile);
router.delete('/me', UserController.deleteAccount);
router.get('/me/preferences', UserController.getPreferences);
router.put('/me/preferences', UserController.updatePreferences);
router.post('/me/avatar', uploadAvatar, UserController.uploadAvatar);
router.get('/me/history', UserController.getHistory);
router.get('/me/devices', UserController.getDevices);
router.delete('/me/devices/:sessionId', UserController.revokeSession);
router.post('/me/devices/revoke-others', UserController.revokeOtherSessions);

export { router as userRoutes };
