import { Router, Request, Response } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../services/userService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

interface ReqWithAuth extends Request {
  auth: { accountId: number; role: string };
}

const router = Router();

/** GET /api/users */
router.get(
  '/',
  requireRole('account_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const users = await listUsers(accountId);
      res.status(200).json({ users });
    } catch (err: unknown) {
      logger.error('List users error', { error: err });
      res
        .status(500)
        .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
  },
);

/** POST /api/users */
router.post(
  '/',
  requireRole('account_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const user = await createUser(accountId, req.body);
      res.status(201).json(user);
    } catch (err: unknown) {
      logger.error('Create user error', { error: err });
      res
        .status(400)
        .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
  },
);

/** PUT /api/users/:userId */
router.put(
  '/:userId',
  requireRole('account_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const userId = Number(req.params.userId);
      const updated = await updateUser(accountId, userId, req.body);
      res.status(200).json(updated);
    } catch (err: unknown) {
      logger.error('Update user error', { error: err });
      res
        .status(400)
        .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
  },
);

/** DELETE /api/users/:userId */
router.delete(
  '/:userId',
  requireRole('account_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const userId = Number(req.params.userId);
      await deleteUser(accountId, userId);
      res.status(204).end();
    } catch (err: unknown) {
      logger.error('Delete user error', { error: err });
      res
        .status(400)
        .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
  },
);

export default router;
