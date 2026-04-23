import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/admin.service';

export class AdminTicketsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getTickets(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await AdminService.getTicketById(req.params.id);
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await AdminService.updateTicket(req.params.id, req.body);
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  static async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await AdminService.updateTicket(req.params.id, { assignedTo: req.body.assignedTo });
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  static async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await AdminService.updateTicket(req.params.id, { status: 'RESOLVED', resolution: req.body.resolution });
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  static async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await AdminService.updateTicket(req.params.id, { status: 'CLOSED' });
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }
}
