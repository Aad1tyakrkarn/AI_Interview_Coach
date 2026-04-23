import { Request, Response, NextFunction } from 'express';
import { jwtVerify, errors } from 'jose';
import { config } from '../config';
import { AppError } from './error.middleware';

const jwtSecret = new TextEncoder().encode(config.jwt.secret);

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
  userRole?: string;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('No token provided', 401));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    const decoded = payload as { userId: string; sessionId: string; role: string };

    (req as AuthenticatedRequest).userId = decoded.userId;
    (req as AuthenticatedRequest).sessionId = decoded.sessionId;
    (req as AuthenticatedRequest).userRole = decoded.role;
    next();
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      next(new AppError('Token expired', 401));
    } else {
      next(new AppError('Invalid token', 401));
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = (req as AuthenticatedRequest).userRole;
    if (!userRole || !roles.includes(userRole)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }
    next();
  };
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    const decoded = payload as { userId: string; sessionId: string; role: string };
    (req as AuthenticatedRequest).userId = decoded.userId;
    (req as AuthenticatedRequest).sessionId = decoded.sessionId;
    (req as AuthenticatedRequest).userRole = decoded.role;
  } catch {
    // Token invalid, proceed without auth
  }
  next();
}
