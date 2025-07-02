import { Router, Request, Response } from 'express';
import { registerCompany, loginUser } from '../services/authService';
import { logger } from '../utils/logger';
import { jwtMiddleware } from '../middleware/auth';
import { createUser } from '../services/userService';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/company/register', async (req, res) => {
  try {
    // Step 1: Create company
    const savedAccount = await registerCompany(req.body.company);
    // Step 2: Create first account_admin user
    const adminUser = await createUser(savedAccount.accountId, {
      ...req.body.admin,
      role: 'account_admin',
    });
    // Step 3: Issue JWT
    const token = jwt.sign(
      {
        userId: adminUser.userId,
        accountId: savedAccount.accountId,
        role: adminUser.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' },
    );
    res.status(201).json({ token });
  } catch (err: unknown) {
    logger.error('Company registration error', { error: err });
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const token = await loginUser(username, password);
    res.status(200).json({ token });
  } catch (err: unknown) {
    logger.error('Login error', { error: err });
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ message });
  }
});

// GET /auth/me - return user info if JWT is valid
router.get('/me', jwtMiddleware, (req: Request, res: Response) => {
  // req.auth is set by the JWT middleware
  if (!('auth' in req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // Return the JWT payload (userId, accountId, role)
  // You can expand this to fetch more user info if needed
  // (req as any).auth is used for type safety
  return res.json({ user: (req as any).auth });
});

export default router;
