import { Router, Request, Response } from 'express';
import { registerCompany, loginUser } from '../services/authService';
import { logger } from '../utils/logger';
import { jwtMiddleware } from '../middleware/auth';
import { createUser } from '../services/userService';
import jwt from 'jsonwebtoken';

const router = Router();

interface ReqWithAuth extends Request {
  auth: {
    userId: number;
    accountId: number;
    role: string;
    username?: string;
    fullName?: string;
  };
}

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
        username: adminUser.username,
        fullName: adminUser.fullName,
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and get JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 * /auth/me:
 *   get:
 *     summary: Get current user info (requires JWT)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
// GET /auth/me - return user info if JWT is valid
router.get('/me', jwtMiddleware, (req: Request, res: Response) => {
  if (!('auth' in req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // Add username and fullName to the user object if present in JWT
  const auth = (req as ReqWithAuth).auth;
  const { userId, accountId, role, username, fullName } = auth;
  return res.json({ user: { userId, accountId, role, username, fullName } });
});

export default router;
