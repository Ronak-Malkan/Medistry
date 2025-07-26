import { Router, Request, Response } from 'express';
import { IncomingBillService } from '../services/incomingBillService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const incomingBillService = new IncomingBillService();

/**
 * @swagger
 * /api/incoming-bills:
 *   get:
 *     summary: List all incoming bills
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of incoming bills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IncomingBill'
 *   post:
 *     summary: Create a new incoming bill
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bill:
 *                 $ref: '#/components/schemas/IncomingBill'
 *               entries:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IncomingBillEntry'
 *     responses:
 *       201:
 *         description: Created incoming bill
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncomingBill'
 * /api/incoming-bills/{id}:
 *   get:
 *     summary: Get incoming bill by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incoming bill details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncomingBill'
 */
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
      res.json({ incomingBills: bills });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Search incoming bills
router.get(
  '/search',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const { q } = req.query;
      const bills = await incomingBillService.search(
        String(q || ''),
        accountId,
      );
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
