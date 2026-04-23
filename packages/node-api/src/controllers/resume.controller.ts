import { Request, Response, NextFunction } from 'express';
import { ResumeService } from '../services/resume.service';

export class ResumeController {
  static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ResumeService.upload(userId, req.file!);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ResumeService.list(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ResumeService.getById(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getParsedData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ResumeService.getParsedData(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ResumeService.update(userId, req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async reparse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await ResumeService.reparse(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      await ResumeService.delete(userId, req.params.id);
      res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
