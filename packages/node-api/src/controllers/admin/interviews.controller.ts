import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/admin.service';
import { prisma } from '../../config/database';

export class AdminInterviewsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getInterviews(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getActive(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getActiveInterviews();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await prisma.interview.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          interviewQuestions: { include: { question: true }, orderBy: { questionIndex: 'asc' } },
          scores: true,
        },
      });
      if (!interview) { res.status(404).json({ error: 'Interview not found' }); return; }
      res.json(interview);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await prisma.interview.update({ where: { id: req.params.id }, data: req.body });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.interview.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
      res.json({ deleted: true, id: req.params.id });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await AdminService.getInterviewAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }
}
