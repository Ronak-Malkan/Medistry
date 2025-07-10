import { Router, Request, Response } from 'express';
import { getAccount, updateAccount } from '../services/accountService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

interface ReqWithAuth extends Request {
  auth: { accountId: number; role: string };
}

const router = Router();

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get account details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 */
/**
 * GET /api/accounts
 */
router.get(
  '/',
  requireRole('account_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const account = await getAccount(accountId);
      res.status(200).json(account);
    } catch (err: unknown) {
      logger.error('Get account error', { error: err });
      res
        .status(500)
        .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
  },
);

/**
 * PUT /api/accounts
 */
router.put(
  '/',
  requireRole('account_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const updated = await updateAccount(accountId, req.body);
      res.status(200).json(updated);
    } catch (err: unknown) {
      logger.error('Update account error', { error: err });
      res
        .status(500)
        .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
  },
);

export default router;
