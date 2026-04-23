import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/admin.service';
import { prisma } from '../../config/database';

export class AdminSystemController {
  static async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await AdminService.getSystemHealth();
      res.json(health);
    } catch (error) {
      next(error);
    }
  }

  static async getMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await AdminService.getSystemAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const skip = (page - 1) * limit;
      const where: any = {};
      if (req.query.action) where.action = req.query.action;
      if (req.query.userId) where.userId = req.query.userId;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { timestamp: 'desc' } }),
        prisma.auditLog.count({ where }),
      ]);
      res.json({ data: logs, total, page, limit });
    } catch (error) {
      next(error);
    }
  }

  static async getConfig(_req: Request, res: Response): Promise<void> {
    res.json({
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      corsOrigin: process.env.CORS_ORIGIN || '*',
      rateLimitMax: process.env.RATE_LIMIT_MAX || 100,
    });
  }

  static async updateConfig(req: Request, res: Response): Promise<void> {
    // Config updates would require server restart in production
    res.json({ message: 'Config updates require server restart', received: req.body });
  }

  static async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await AdminService.getSystemAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  static async getPeakUsage(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usage = await AdminService.getPeakUsage();
      res.json(usage);
    } catch (error) {
      next(error);
    }
  }

  static async getApiUsage(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usage = await AdminService.getApiUsageStats();
      res.json(usage);
    } catch (error) {
      next(error);
    }
  }

  static async getStorage(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storage = await AdminService.getStorageUsage();
      res.json(storage);
    } catch (error) {
      next(error);
    }
  }
}
