// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { expressjwt, Request as JWTRequest } from 'express-jwt';

const jwtSecret = process.env.JWT_SECRET;

// If no JWT_SECRET is provided (e.g. in CI/test), skip JWT verification
export const jwtMiddleware: (
  req: Request,
  res: Response,
  next: NextFunction,
) => void = jwtSecret
  ? expressjwt({
      secret: jwtSecret,
      algorithms: ['HS256'],
      credentialsRequired: true,
    })
  : (_req, _res, next) => {
      next();
    };

// Extend the JWTRequest so TS knows req.auth exists
interface AuthenticatedRequest extends JWTRequest {
  auth: {
    role: string;
    [key: string]: unknown;
  };
}

/**
 * Checks that req.auth.role is one of the allowedRoles.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { role } = req.auth;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
