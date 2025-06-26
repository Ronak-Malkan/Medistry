import { Request, RequestHandler } from 'express';
import { expressjwt } from 'express-jwt';

const jwtSecret = process.env.JWT_SECRET;

// Skip JWT in tests if no secret
export const jwtMiddleware: RequestHandler = jwtSecret
  ? expressjwt({
      secret: jwtSecret,
      algorithms: ['HS256'],
      credentialsRequired: true,
    })
  : (_req, _res, next) => next();

// Extend Request to include the JWT payload
interface ReqWithAuth extends Request {
  auth: { accountId: number; role: string; [key: string]: unknown };
}

/**
 * Guard routes by allowedRoles.
 */
export const requireRole = (...allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const auth = (req as ReqWithAuth).auth;
    if (!auth?.role || !allowedRoles.includes(auth.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
