import { Request, Response, NextFunction } from 'express';
import { QuestionService } from '../services/question.service';

export class QuestionController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await QuestionService.list(req.query as Record<string, unknown>);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await QuestionService.getById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await QuestionService.getCategories();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getByRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await QuestionService.getByRole(req.params.roleId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
