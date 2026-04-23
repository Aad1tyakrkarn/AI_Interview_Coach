import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  static async getByInterviewId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ReportService.getByInterviewId(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ReportService.generateReport(req.params.interviewId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ReportService.getPdf(req.params.interviewId);
      res.setHeader('Content-Type', 'text/html');
      res.send(result.html);
    } catch (error) {
      next(error);
    }
  }

  static async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReportService.getTrends(userId, req.query as Record<string, unknown>);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getReadiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReportService.getReadiness(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReportService.getRecommendations(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ReportService.getHistory(userId, req.query as Record<string, unknown>);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
