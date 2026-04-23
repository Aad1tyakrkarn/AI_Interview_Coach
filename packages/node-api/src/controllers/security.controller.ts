import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/security.service';

export class SecurityController {
  static async submitConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await SecurityService.submitConsent(userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await SecurityService.getConsent(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async requestDataDeletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { reason } = req.body;
      const result = await SecurityService.requestDataDeletion(userId, reason);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const result = await SecurityService.getAuditLogs(userId, req.query as Record<string, unknown>);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getPrivacyPolicy(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SecurityService.getPrivacyPolicy();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async acceptPrivacyPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { version } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
      const userAgent = req.headers['user-agent'];
      const result = await SecurityService.acceptPrivacyPolicy(userId, version || '1.0.0', ipAddress, userAgent);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async checkPrivacyPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId;
      const accepted = await SecurityService.hasAcceptedPrivacyPolicy(userId);
      res.json({ accepted });
    } catch (error) {
      next(error);
    }
  }

  static async getEthicalAI(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SecurityService.getEthicalAIDeclaration();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getHiringDisclaimer(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SecurityService.getHiringDisclaimer();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
