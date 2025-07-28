import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/auth';
import { MedicineService } from '../services/medicineService';
import { MedicineStockService } from '../services/medicineStockService';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const service = new MedicineService();
const stockService = new MedicineStockService();

/**
 * @swagger
 * /api/medicines/master:
 *   get:
 *     summary: List all medicines (master data)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of medicines
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medicines:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medicine'
 *   post:
 *     summary: Create a new medicine
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               hsn:
 *                 type: string
 *               contentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Created medicine
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medicine'
 * /api/medicines/master/{id}:
 *   put:
 *     summary: Update a medicine
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               hsn:
 *                 type: string
 *               contentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Updated medicine
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medicine'
 *   delete:
 *     summary: Delete a medicine
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
 * /api/medicines/search:
 *   get:
 *     summary: Smart search for medicines (top 15 prefix matches)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Prefix to search
 *     responses:
 *       200:
 *         description: List of matching medicines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Medicine'
 * /api/medicines/searchall:
 *   get:
 *     summary: Smart search for all medicines (all prefix matches)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Prefix to search
 *     responses:
 *       200:
 *         description: List of matching medicines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Medicine'
 * /api/medicines/stats:
 *   get:
 *     summary: Get medicine statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Medicine statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 * /api/medicines/low-stock:
 *   get:
 *     summary: Get low stock medicines count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 * /api/medicines/expiring-soon:
 *   get:
 *     summary: Get expiring soon medicines count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiring soon count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
// List all medicines
router.get(
  '/master',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const medicines = await service.list();
      res.status(200).json({ medicines });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  },
);

// Create a medicine (optionally with contents)
router.post(
  '/master',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const medicine = await service.create(req.body);
      res.status(201).json(medicine);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },
);

// Update a medicine
router.put(
  '/master/:medicineId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.medicineId);
      const updated = await service.update(id, req.body);
      res.status(200).json(updated);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },
);

// Delete a medicine
router.delete(
  '/master/:medicineId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.medicineId);
      await service.delete(id);
      res.status(204).end();
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },
);

// Smart search (top 15)
router.get(
  '/search',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const prefix = String(req.query.prefix || '');
      const results = await service.smartSearch(prefix, 15);
      res.json(results);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },
);

// Smart search (all)
router.get(
  '/searchall',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const prefix = String(req.query.prefix || '');
      const results = await service.smartSearch(prefix);
      res.json(results);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },
);

// Get medicine statistics
router.get(
  '/stats',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const medicines = await service.list();
      res.json({ count: medicines.length });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  },
);

// Get low stock medicines count
router.get(
  '/low-stock',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const lowStockCount = await stockService.getLowStockCount(accountId);
      res.json({ count: lowStockCount });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  },
);

// Get expiring soon medicines count
router.get(
  '/expiring-soon',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const expiringCount = await stockService.getExpiringSoonCount(accountId);
      res.json({ count: expiringCount });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  },
);

export default router;
