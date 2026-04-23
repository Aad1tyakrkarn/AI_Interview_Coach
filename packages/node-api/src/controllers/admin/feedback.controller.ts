import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/admin.service';
import { prisma } from '../../config/database';

export class AdminFeedbackController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getFeedback(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await prisma.report.findUnique({
        where: { id: req.params.id },
        select: { id: true, interviewId: true, userId: true, summary: true, questionFeedback: true, generatedAt: true },
      });
      if (!report) { res.status(404).json({ error: 'Feedback not found' }); return; }
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  static async respond(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Log admin response as audit entry
      await prisma.auditLog.create({
        data: {
          userId: (req as any).userId,
          action: 'feedback_reviewed',
          resource: 'report',
          resourceId: req.params.id,
          details: { response: req.body.response },
        },
      });
      res.json({ reviewed: true, id: req.params.id });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalReports, avgScore] = await Promise.all([
        prisma.report.count(),
        prisma.score.aggregate({ _avg: { overallScore: true } }),
      ]);
      res.json({ totalReports, avgScore: Math.round(avgScore._avg.overallScore || 0) });
    } catch (error) {
      next(error);
    }
  }
}
