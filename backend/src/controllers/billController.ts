import { Router, Request, Response } from 'express';
import { BillService } from '../services/billService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const billService = new BillService();

// Create bill
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      console.log('POST /api/bills - req.body:', req.body);
      const { accountId } = (req as AuthRequest).auth;
      const bill = await billService.create(req.body, accountId);
      res.status(201).json(bill);
    } catch (err) {
      console.error('POST /api/bills - error:', err);
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Get all bills
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const bills = await billService.findByAccount(accountId);
      res.json(bills);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Get bill by id
router.get(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const bill = await billService.findOneById(
        Number(req.params.id),
        accountId,
      );
      if (!bill) return res.status(404).json({ error: 'Bill not found' });
      res.json(bill);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Update bill
router.put(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const updated = await billService.update(
        Number(req.params.id),
        req.body,
        accountId,
      );
      if (!updated) return res.status(404).json({ error: 'Bill not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Delete bill
router.delete(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const result = await billService.delete(Number(req.params.id), accountId);
      if (result.affected === 0)
        return res.status(404).json({ error: 'Bill not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
