import { Router, Request, Response } from 'express';
import { SellingLogService } from '../services/sellingLogService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const sellingLogService = new SellingLogService();

/**
 * @swagger
 * /api/selling-logs:
 *   get:
 *     summary: List all selling logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of selling logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SellingLog'
 *   post:
 *     summary: Create a new selling log
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellingLog'
 *     responses:
 *       201:
 *         description: Created selling log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellingLog'
 */
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
