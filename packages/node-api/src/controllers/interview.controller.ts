import { Request, Response, NextFunction } from 'express';
import { InterviewService } from '../services/interview.service';

export class InterviewController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.create(userId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.list(userId, req.query as Record<string, unknown>);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.getById(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.update(userId, req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      await InterviewService.delete(userId, req.params.id);
      res.json({ message: 'Interview deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.start(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async pause(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.pause(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.resume(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async end(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.end(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async skip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.skipQuestion(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getHints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.getHints(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await InterviewService.getComparison(userId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      // Support both camelCase and snake_case field names from frontend
      const questionIndex = req.body.questionIndex ?? req.body.question_index;
      const answerText = req.body.answerText ?? req.body.answer_text ?? req.body.answer;
      const timeTakenSeconds = req.body.timeTakenSeconds ?? req.body.time_taken_seconds;
      const questionText = req.body.questionText ?? req.body.question_text;

      if (questionIndex === undefined || questionIndex === null) {
        res.status(400).json({ error: 'questionIndex is required' });
        return;
      }
      if (!answerText) {
        res.status(400).json({ error: 'answerText is required' });
        return;
      }

      const result = await InterviewService.submitAnswer(userId, req.params.id, {
        questionIndex: Number(questionIndex),
        answerText,
        timeTakenSeconds: timeTakenSeconds ? Number(timeTakenSeconds) : undefined,
        questionText: questionText || undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
