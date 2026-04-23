import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/admin.service';

export class AdminQuestionsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getQuestions(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await AdminService.getQuestions({ search: req.params.id });
      res.json(question);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await AdminService.createQuestion(req.body);
      res.status(201).json(question);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await AdminService.updateQuestion(req.params.id, req.body);
      res.json(question);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.deleteQuestion(req.params.id);
      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async bulkImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.bulkImportQuestions(req.body.questions);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await AdminService.getQuestionAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }
}
