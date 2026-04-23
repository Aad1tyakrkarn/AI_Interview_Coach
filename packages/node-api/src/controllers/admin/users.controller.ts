import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/admin.service';

export class AdminUsersController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getUsers(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AdminService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AdminService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.deleteUser(req.params.id);
      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async suspend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AdminService.updateUser(req.params.id, { isActive: false });
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AdminService.updateUser(req.params.id, { isActive: true });
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await AdminService.getUserAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }
}
