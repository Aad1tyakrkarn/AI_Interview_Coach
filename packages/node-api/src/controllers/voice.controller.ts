import { Request, Response, NextFunction } from 'express';
import { VoiceService } from '../services/voice.service';

export class VoiceController {
  static async createTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VoiceService.createTranscript(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getTranscripts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VoiceService.getTranscripts(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VoiceService.updateTranscript(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VoiceService.getAnalysis(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VoiceService.getMetrics(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async transcribeAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { audioUrl } = req.body;
      const result = await VoiceService.transcribeAudio(audioUrl);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async analyzeAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { audioUrl, questionIndex } = req.body;
      const result = await VoiceService.analyzeAudio(audioUrl, req.params.interviewId, questionIndex);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async saveAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionIndex, metrics } = req.body;
      const result = await VoiceService.saveAnalysis(req.params.interviewId, questionIndex, metrics);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
