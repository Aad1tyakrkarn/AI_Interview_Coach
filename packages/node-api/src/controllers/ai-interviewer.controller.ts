import { Request, Response, NextFunction } from 'express';
import { AIInterviewerService } from '../services/ai-interviewer.service';

export class AIInterviewerController {
  static async generateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const result = await AIInterviewerService.generateQuestion(interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async generateFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const { previousQuestion, answer } = req.body;
      const result = await AIInterviewerService.generateFollowUp(interviewId, previousQuestion, answer);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async adaptDifficulty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const result = await AIInterviewerService.adaptDifficulty(interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async handleSilence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const { silenceDurationSeconds } = req.body;
      const result = await AIInterviewerService.handleSilence(interviewId, silenceDurationSeconds);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getClosingMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const result = await AIInterviewerService.getClosingMessage(interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async rephraseQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question } = req.body;
      const result = await AIInterviewerService.rephraseQuestion(question);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSkipAcknowledgement(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AIInterviewerService.getSkipAcknowledgement();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async generateDynamicQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const { conversationHistory, lastAnswerText } = req.body;
      const result = await AIInterviewerService.generateDynamicQuestion(
        interviewId,
        conversationHistory || [],
        lastAnswerText,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAcknowledgement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const { answerText } = req.body;
      const result = await AIInterviewerService.getAcknowledgement(interviewId, answerText);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getEncouragement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const result = await AIInterviewerService.getEncouragement(interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async generateIntro(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const userId = (req as any).userId;
      const result = await AIInterviewerService.generateIntro(interviewId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getCoachingFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const metrics = req.body;
      const result = await AIInterviewerService.getCoachingFeedback(interviewId, metrics);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAnswerFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const { question, answer, ...metrics } = req.body;
      const result = await AIInterviewerService.getAnswerFeedback(interviewId, question, answer, metrics);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async generateResumeQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const userId = (req as any).userId;
      const { conversationHistory } = req.body;
      const result = await AIInterviewerService.generateResumeQuestion(interviewId, userId, conversationHistory || []);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
