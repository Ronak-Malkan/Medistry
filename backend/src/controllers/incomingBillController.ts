import { Router, Request, Response } from 'express';
import { IncomingBillService } from '../services/incomingBillService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const incomingBillService = new IncomingBillService();

// Create incoming bill
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const bill = await incomingBillService.create(req.body, accountId);
      res.status(201).json(bill);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Get all incoming bills
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const bills = await incomingBillService.findByAccount(accountId);
      res.json(bills);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Get incoming bill by id
router.get(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const bill = await incomingBillService.findOneById(
        Number(req.params.id),
        accountId,
      );
      if (!bill)
        return res.status(404).json({ error: 'Incoming bill not found' });
      res.json(bill);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Update incoming bill
router.put(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const updated = await incomingBillService.update(
        Number(req.params.id),
        req.body,
        accountId,
      );
      if (!updated)
        return res.status(404).json({ error: 'Incoming bill not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Delete incoming bill
router.delete(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const result = await incomingBillService.delete(
        Number(req.params.id),
        accountId,
      );
      if (result.affected === 0)
        return res.status(404).json({ error: 'Incoming bill not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
