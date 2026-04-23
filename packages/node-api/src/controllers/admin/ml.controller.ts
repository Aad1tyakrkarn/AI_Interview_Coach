import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/admin.service';
import { prisma } from '../../config/database';

export class AdminMLController {
  static async listModels(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const models = await AdminService.getMLModels();
      res.json({ data: models, total: models.length });
    } catch (error) {
      next(error);
    }
  }

  static async getModel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const model = await prisma.mLModelVersion.findUnique({ where: { id: req.params.id } });
      if (!model) { res.status(404).json({ error: 'Model not found' }); return; }
      res.json(model);
    } catch (error) {
      next(error);
    }
  }

  static async deployModel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Deactivate all versions of this model, then activate the specified one
      const model = await prisma.mLModelVersion.findUnique({ where: { id: req.params.id } });
      if (!model) { res.status(404).json({ error: 'Model not found' }); return; }
      await prisma.mLModelVersion.updateMany({ where: { modelName: model.modelName }, data: { isActive: false } });
      const updated = await prisma.mLModelVersion.update({ where: { id: req.params.id }, data: { isActive: true, deployedAt: new Date() } });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async rollbackModel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const current = await prisma.mLModelVersion.findUnique({ where: { id: req.params.id } });
      if (!current) { res.status(404).json({ error: 'Model not found' }); return; }
      // Find the previous active version
      const previous = await prisma.mLModelVersion.findFirst({
        where: { modelName: current.modelName, id: { not: current.id }, deployedAt: { not: null } },
        orderBy: { deployedAt: 'desc' },
      });
      if (!previous) { res.status(400).json({ error: 'No previous version to rollback to' }); return; }
      await prisma.mLModelVersion.update({ where: { id: current.id }, data: { isActive: false } });
      const rolled = await prisma.mLModelVersion.update({ where: { id: previous.id }, data: { isActive: true, deployedAt: new Date() } });
      res.json(rolled);
    } catch (error) {
      next(error);
    }
  }

  static async getModelMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const model = await prisma.mLModelVersion.findUnique({ where: { id: req.params.id } });
      if (!model) { res.status(404).json({ error: 'Model not found' }); return; }
      // Get scores that used this model version
      const scores = await prisma.score.findMany({
        where: { modelVersion: model.version },
        select: { overallScore: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const avg = scores.length > 0 ? scores.reduce((s, sc) => s + sc.overallScore, 0) / scores.length : 0;
      res.json({ model, metrics: { avgScore: Math.round(avg), totalEvaluations: scores.length, scores: scores.slice(0, 20) } });
    } catch (error) {
      next(error);
    }
  }

  static async createModel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const model = await prisma.mLModelVersion.create({ data: req.body });
      res.status(201).json(model);
    } catch (error) {
      next(error);
    }
  }

  static async getDrift(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const drift = await AdminService.getMLDrift();
      res.json(drift);
    } catch (error) {
      next(error);
    }
  }

  static async triggerRetrain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.triggerRetrain(req.body.modelName);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
