import { Router, Request } from 'express';
import { MedicineStockService } from '../services/medicineStockService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const service = new MedicineStockService();

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

// Create
router.post('/', requireRole('app_admin'), async (req: Request, res) => {
  try {
    logger.info('POST /api/medicine-stock • req.body:', req.body);
    const { accountId } = (req as AuthRequest).auth;
    const stock = await service.create({ ...req.body, accountId });
    res.status(201).json(stock);
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
});

// Update
router.put('/:id', requireRole('app_admin'), async (req: Request, res) => {
  try {
    logger.info(
      'PUT /api/medicine-stock/:id • params:',
      req.params,
      'body:',
      req.body,
    );
    const { accountId } = (req as AuthRequest).auth;
    const stock = await service.update(
      Number(req.params.id),
      { ...req.body, accountId },
      accountId,
    );
    if (!stock) return res.status(404).json({ error: 'Not found' });
    res.json(stock);
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
});

// Delete
router.delete('/:id', requireRole('app_admin'), async (req: Request, res) => {
  try {
    const { accountId } = (req as AuthRequest).auth;
    const ok = await service.delete(Number(req.params.id), accountId);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
});

// Search (top 15)
router.get('/search', requireRole('app_admin'), async (req: Request, res) => {
  try {
    const { prefix } = req.query;
    const { accountId } = (req as AuthRequest).auth;
    const results = await service.search(String(prefix || ''), accountId, 15);
    res.json(results);
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
});

// Search all
router.get(
  '/searchall',
  requireRole('app_admin'),
  async (req: Request, res) => {
    try {
      const { prefix } = req.query;
      const { accountId } = (req as AuthRequest).auth;
      const results = await service.search(String(prefix || ''), accountId);
      res.json(results);
    } catch (err: unknown) {
      res.status(400).json({ error: getErrorMessage(err) });
    }
  },
);

export default router;
