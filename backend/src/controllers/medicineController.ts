import { Router, Request, Response } from 'express';
import {
  listMedicines,
  createOrUpdateMedicine,
  updateMedicine,
  deleteMedicine,
  MedicineDTO,
  getMedicineStats,
  getLowStockCount,
  getExpiringSoonCount,
} from '../services/medicineService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

interface ReqWithAuth extends Request {
  auth: { accountId: number; role: string };
}

const router = Router();

// GET /api/medicines?q=
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const meds = await listMedicines(accountId, q);
      res.status(200).json({ medicines: meds });
    } catch (e) {
      logger.error('List medicines failed', { error: e });
      res.status(500).json({ message: (e as Error).message });
    }
  },
);

// POST /api/medicines
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const dto = req.body as MedicineDTO;
      const med = await createOrUpdateMedicine(accountId, dto);
      res.status(201).json(med);
    } catch (e) {
      logger.error('Create medicine failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

// PUT /api/medicines/:id
router.put(
  '/:medicineId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.medicineId);
      const dto = req.body as Partial<MedicineDTO>;
      const updated = await updateMedicine(accountId, id, dto);
      res.status(200).json(updated);
    } catch (e) {
      logger.error('Update medicine failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

// DELETE /api/medicines/:id
router.delete(
  '/:medicineId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.medicineId);
      await deleteMedicine(accountId, id);
      res.status(204).end();
    } catch (e) {
      logger.error('Delete medicine failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

// GET /api/medicines/stats
router.get(
  '/stats',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const count = await getMedicineStats(accountId);
      res.json({ count });
    } catch (e) {
      logger.error('Get medicine stats failed', { error: e });
      res.status(500).json({ message: (e as Error).message });
    }
  },
);

// GET /api/medicines/low-stock
router.get(
  '/low-stock',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const count = await getLowStockCount(accountId);
      res.json({ count });
    } catch (e) {
      logger.error('Get low stock count failed', { error: e });
      res.status(500).json({ message: (e as Error).message });
    }
  },
);

// GET /api/medicines/expiring-soon
router.get(
  '/expiring-soon',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const count = await getExpiringSoonCount(accountId);
      res.json({ count });
    } catch (e) {
      logger.error('Get expiring soon count failed', { error: e });
      res.status(500).json({ message: (e as Error).message });
    }
  },
);

export default router;
