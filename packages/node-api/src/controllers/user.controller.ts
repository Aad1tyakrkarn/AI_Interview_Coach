import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await UserService.getProfile(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await UserService.updateProfile(userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { password } = req.body ?? {};
      await UserService.deleteAccount(userId, password);
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await UserService.getPreferences(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await UserService.updatePreferences(userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await UserService.uploadAvatar(userId, req.file!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await UserService.getHistory(userId, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const sessionId = (req as any).sessionId;
      const result = await UserService.getDevices(userId, sessionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const currentSessionId = (req as any).sessionId;
      await UserService.revokeSession(userId, req.params.sessionId, currentSessionId);
      res.json({ message: 'Session revoked' });
    } catch (error) {
      next(error);
    }
  }

  static async revokeOtherSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const currentSessionId = (req as any).sessionId;
      if (!currentSessionId) {
        res.status(400).json({ error: { message: 'No current session found' } });
        return;
      }
      const result = await UserService.revokeOtherSessions(userId, currentSessionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
