import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { SecurityService } from '../services/security.service';

export function auditMiddleware(action: string, resource: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      await SecurityService.logActivity({
        userId,
        action,
        resource,
        resourceId: req.params.id,
        details: { method: req.method, path: req.path },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    } catch {
      // Don't block request if audit logging fails
    }
    next();
  };
}
