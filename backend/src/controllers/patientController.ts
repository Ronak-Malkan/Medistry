import { Router, Request, Response } from 'express';
import { PatientService } from '../services/patientService';
import { requireRole } from '../middleware/auth';

interface AuthRequest extends Request {
  auth: { accountId: number; role: string; userId: number };
}

const router = Router();
const patientService = new PatientService();

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: List all patients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *   post:
 *     summary: Create a new patient
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: Created patient
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 */
// Create patient
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const patient = await patientService.create(req.body, accountId);
      res.status(201).json(patient);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Get all patients
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const patients = await patientService.findByAccount(accountId);
      res.json(patients);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Smart search endpoint
router.get(
  '/search',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    const { accountId } = (req as AuthRequest).auth;
    const q = (req.query.q as string) || '';
    try {
      const results = await patientService.smartSearch(q, accountId, 10);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Get patient by id
router.get(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const patient = await patientService.findOneById(
        Number(req.params.id),
        accountId,
      );
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json(patient);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// Update patient
router.put(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const updated = await patientService.update(
        Number(req.params.id),
        req.body,
        accountId,
      );
      if (!updated) return res.status(404).json({ error: 'Patient not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// Delete patient
router.delete(
  '/:id',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = (req as AuthRequest).auth;
      const result = await patientService.delete(
        Number(req.params.id),
        accountId,
      );
      if (result.affected === 0)
        return res.status(404).json({ error: 'Patient not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
