import { Request, Response, NextFunction } from 'express';
import { EvaluationService } from '../services/evaluation.service';

export class EvaluationController {
  static async evaluateAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const { questionIndex, question, answer, expectedTopics, resumeData, questionId } = req.body;

      if (!question || !answer) {
        res.status(400).json({ error: 'question and answer are required' });
        return;
      }

      const result = await EvaluationService.evaluateAnswer(
        interviewId,
        questionIndex ?? 0,
        question,
        answer,
        expectedTopics ?? [],
        resumeData ?? null,
        questionId ?? null,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getByInterviewId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EvaluationService.getByInterviewId(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getByQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EvaluationService.getByQuestion(
        req.params.interviewId,
        req.params.questionId
      );
      if (!result) {
        res.status(404).json({ error: 'Evaluation not found' });
        return;
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getExplainability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EvaluationService.getExplainability(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getModelVersions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EvaluationService.getModelVersions();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async trackModelVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, version, description } = req.body;

      if (!name || !version) {
        res.status(400).json({ error: 'name and version are required' });
        return;
      }

      const result = await EvaluationService.trackModelVersion({
        name,
        version,
        description: description ?? '',
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
