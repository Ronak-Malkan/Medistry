import { Router, Request, Response } from 'express';
import {
  listMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  MedicineDTO,
  listMedicineStock,
  createOrUpdateMedicineStock,
  updateMedicineStock,
  deleteMedicineStock,
  MedicineStockDTO,
  getMedicineStockStats,
} from '../services/medicineService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

interface ReqWithAuth extends Request {
  auth: { accountId: number; role: string };
}

const router = Router();

// --- Master Medicine CRUD ---
router.get(
  '/master',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const meds = await listMedicines();
      res.status(200).json({ medicines: meds });
    } catch (e) {
      logger.error('List master medicines failed', { error: e });
      res.status(500).json({ message: (e as Error).message });
    }
  },
);

router.post(
  '/master',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as MedicineDTO;
      const med = await createMedicine(dto);
      res.status(201).json(med);
    } catch (e) {
      logger.error('Create master medicine failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

router.put(
  '/master/:medicineId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.medicineId);
      const dto = req.body as Partial<MedicineDTO>;
      const updated = await updateMedicine(id, dto);
      res.status(200).json(updated);
    } catch (e) {
      logger.error('Update master medicine failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

router.delete(
  '/master/:medicineId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.medicineId);
      await deleteMedicine(id);
      res.status(204).end();
    } catch (e) {
      logger.error('Delete master medicine failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

// --- Medicine Stock CRUD ---
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const meds = await listMedicineStock(accountId, q);
      res.status(200).json({ medicines: meds });
    } catch (e) {
      logger.error('List medicine stock failed', { error: e });
      res.status(500).json({ message: (e as Error).message });
    }
  },
);

router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const dto = req.body as MedicineStockDTO;
      const med = await createOrUpdateMedicineStock(accountId, dto);
      res.status(201).json(med);
    } catch (e) {
      logger.error('Create medicine stock failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

router.put(
  '/:medicineStockId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.medicineStockId);
      const dto = req.body as Partial<MedicineStockDTO>;
      const updated = await updateMedicineStock(accountId, id, dto);
      res.status(200).json(updated);
    } catch (e) {
      logger.error('Update medicine stock failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

router.delete(
  '/:medicineStockId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.medicineStockId);
      await deleteMedicineStock(accountId, id);
      res.status(204).end();
    } catch (e) {
      logger.error('Delete medicine stock failed', { error: e });
      res.status(400).json({ message: (e as Error).message });
    }
  },
);

// --- Stats ---
router.get(
  '/stats',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const count = await getMedicineStockStats(accountId);
      res.json({ count });
    } catch (e) {
      logger.error('Get medicine stock stats failed', { error: e });
      res.status(500).json({ message: (e as Error).message });
    }
  },
);

export default router;
