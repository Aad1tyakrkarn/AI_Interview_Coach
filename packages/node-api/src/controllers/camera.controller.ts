import { Request, Response, NextFunction } from 'express';
import { CameraService } from '../services/camera.service';

export class CameraController {
  static async analyzeFrames(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId } = req.params;
      const { questionIndex, frames } = req.body;

      if (!interviewId || questionIndex === undefined || !Array.isArray(frames)) {
        res.status(400).json({ error: { message: 'interviewId, questionIndex, and frames are required' } });
        return;
      }

      const result = await CameraService.analyzeFrames(interviewId, questionIndex, frames);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interviewId, questionIndex, aggregated } = req.body;

      if (!interviewId || questionIndex === undefined || !aggregated) {
        res.status(400).json({ error: { message: 'interviewId, questionIndex, and aggregated are required' } });
        return;
      }

      const result = await CameraService.createAnalysis({ interviewId, questionIndex, aggregated });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CameraService.getAnalysis(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async submitConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { interviewId, granted } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      const result = await CameraService.submitConsent(userId, interviewId, granted, ipAddress, userAgent);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CameraService.getConsent(req.params.interviewId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async checkQuality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { frame } = req.body;

      if (!frame) {
        res.status(400).json({ error: { message: 'frame (base64) is required' } });
        return;
      }

      const result = await CameraService.checkFrameQuality(frame);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
