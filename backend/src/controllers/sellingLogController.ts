import { Router, Request, Response } from 'express';
import { SellingLogService } from '../services/sellingLogService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const sellingLogService = new SellingLogService();

// Create selling log (decrement stock)
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const log = await sellingLogService.create(req.body, accountId);
      res.status(201).json(log);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Get all selling logs
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const logs = await sellingLogService.findByAccount(accountId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
