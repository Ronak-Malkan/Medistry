import { Router, Request, Response } from 'express';
import { MedicineContentsService } from '../services/medicineContentsService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const medicineContentsService = new MedicineContentsService();

// Add content to medicine
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { medicine_id, content_id } = req.body;
      if (!medicine_id || !content_id) {
        return res
          .status(400)
          .json({ error: 'medicine_id and content_id are required' });
      }
      const link = await medicineContentsService.add(medicine_id, content_id);
      res.status(201).json(link);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Remove content from medicine
router.delete(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { medicine_id, content_id } = req.body;
      if (!medicine_id || !content_id) {
        return res
          .status(400)
          .json({ error: 'medicine_id and content_id are required' });
      }
      await medicineContentsService.remove(medicine_id, content_id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

export default router;
