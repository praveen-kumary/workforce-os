import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../modules/core/token.service';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    employeeId: string;
    role: string;
    email: string;
  };
  requestId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check if token is blacklisted (logged out)
    const blacklisted = await tokenService.isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked — please log in again' });
    }

    const decoded = tokenService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    logger.warn('Invalid token presented', { error: err.message });
    return res.status(401).json({ error: 'Unauthorized — Invalid token' });
  }
};
