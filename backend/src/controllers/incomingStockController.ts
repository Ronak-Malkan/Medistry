import { Router, Request, Response } from 'express';
import { IncomingStockService } from '../services/incomingStockService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const incomingStockService = new IncomingStockService();

// Create or update incoming stock (merge logic)
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const requiredFields = [
        'incomingBill',
        'medicine',
        'batch_number',
        'incoming_date',
        'hsn_code',
        'quantity_received',
        'unit_cost',
        'expiry_date',
      ];
      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
          return res.status(400).json({ error: `${field} is required` });
        }
      }
      const { accountId } = (req as AuthRequest).auth;
      const stock = await incomingStockService.addOrUpdateStock(
        req.body,
        accountId,
      );
      res.status(201).json(stock);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Get all incoming stocks
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const stocks = await incomingStockService.findByAccount(accountId);
      res.json(stocks);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
