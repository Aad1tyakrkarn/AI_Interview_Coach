import { Request, Response, NextFunction } from 'express';

export function requireConsent(consentType: string) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    // Stub: Check if user has given required consent (e.g., camera, data processing)
    void consentType;
    next(new Error('Not implemented'));
  };
}
