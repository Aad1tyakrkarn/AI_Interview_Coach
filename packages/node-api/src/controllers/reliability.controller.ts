import { Request, Response, NextFunction } from 'express';
import { ReliabilityService } from '../services/reliability.service';

export class ReliabilityController {
  static async autosave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReliabilityService.autosave(userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async heartbeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReliabilityService.heartbeat(userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getConnectionQuality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReliabilityService.getConnectionQuality(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async restoreSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReliabilityService.restoreSession(userId, req.params.sessionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getRestorableSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReliabilityService.getRestorableSessions(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async emergencyExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReliabilityService.emergencyExport(userId, req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
