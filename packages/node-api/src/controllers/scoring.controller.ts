import { Request, Response, NextFunction } from 'express';
import { ScoringService } from '../services/scoring.service';

export class ScoringController {
  static async calculateScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ScoringService.calculateScore(req.params.interviewId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getByInterviewId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ScoringService.getByInterviewId(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ScoringService.getHistory(userId, req.query as Record<string, unknown>);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const interviewIds = (req.query.interviewIds as string || '').split(',');
      const result = await ScoringService.getComparison(userId, interviewIds);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
