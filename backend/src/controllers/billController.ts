import { Router, Request, Response } from 'express';
import { BillService } from '../services/billService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const billService = new BillService();

/**
 * @swagger
 * /api/bills:
 *   get:
 *     summary: List all bills
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bill'
 *   post:
 *     summary: Create a new bill (current logic only)
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
 *                 $ref: '#/components/schemas/Bill'
 *               entries:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BillEntry'
 *     responses:
 *       201:
 *         description: Created bill
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bill'
 * /api/bills/{id}:
 *   get:
 *     summary: Get bill by ID
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
 *         description: Bill details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bill'
 *   put:
 *     summary: Update a bill
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bill'
 *     responses:
 *       200:
 *         description: Updated bill
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bill'
 *   delete:
 *     summary: Delete a bill
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 */
// Create bill
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      console.log('POST /api/bills - req.body:', req.body);
      const { accountId } = (req as AuthRequest).auth;
      if (req.body && req.body.bill && Array.isArray(req.body.entries)) {
        const result = await billService.createBulk(req.body, accountId);
        res.status(201).json(result);
      } else {
        res
          .status(400)
          .json({ error: 'Payload must have { bill, entries } structure' });
      }
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
      // Return patient at root for test compatibility
      const { patient, ...billData } = bill;
      res.json({ ...billData, patient });
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
