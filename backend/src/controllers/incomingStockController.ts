import { Router, Request, Response } from 'express';
import { IncomingStockService } from '../services/incomingStockService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const incomingStockService = new IncomingStockService();

/**
 * @swagger
 * /api/medicine-stock:
 *   get:
 *     summary: List all medicine stock entries
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of medicine stock
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MedicineStock'
 *   post:
 *     summary: Create or update a medicine stock entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicineStock'
 *     responses:
 *       201:
 *         description: Created or updated medicine stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MedicineStock'
 */
// Create or update incoming stock (merge logic)
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      logger.info('IncomingStockController POST / - body:', req.body);
      const requiredFields = [
        'incomingBillId',
        'medicineId',
        'batchNumber',
        'incomingDate',
        'hsnCode',
        'quantityReceived',
        'unitCost',
        'expiryDate',
        'accountId',
      ];
      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
          logger.error(`Missing required field: ${field}`);
          return res.status(400).json({ error: `${field} is required` });
        }
      }
      const { accountId } = (req as AuthRequest).auth;
      const result = await incomingStockService.addOrUpdateStock(
        req.body,
        accountId,
      );
      res.status(201).json(result);
    } catch (err) {
      logger.error('IncomingStockController POST / error:', err);
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
      const { billId } = req.query;

      if (billId) {
        const stocks = await incomingStockService.findByBillId(
          parseInt(billId as string),
          accountId,
        );
        res.json({ incomingStocks: stocks });
      } else {
        const stocks = await incomingStockService.findByAccount(accountId);
        res.json({ incomingStocks: stocks });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Update incoming stock
router.put(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const stockId = parseInt(req.params.id);
      const stock = await incomingStockService.update(
        stockId,
        req.body,
        accountId,
      );
      res.json(stock);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Delete incoming stock
router.delete(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const stockId = parseInt(req.params.id);
      await incomingStockService.delete(stockId, accountId);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

export default router;
