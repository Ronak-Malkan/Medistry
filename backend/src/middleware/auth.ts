import { expressjwt, Request as JWTRequest } from 'express-jwt';
import { Response, NextFunction } from 'express';

const jwtSecret = process.env.JWT_SECRET!;

// JWT middleware to parse & verify tokens, attaching payload to req.auth
export const jwtMiddleware = expressjwt({
  secret: jwtSecret,
  algorithms: ['HS256'],
  credentialsRequired: true,
});

// Extend the JWTRequest so TS knows req.auth.role exists
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
