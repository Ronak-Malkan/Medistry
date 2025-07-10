import { Router, Request, Response } from 'express';
import {
  listProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  smartSearchProviders,
} from '../services/providerService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

interface ReqWithAuth extends Request {
  auth: { accountId: number; role: string };
}

const router = Router();

/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: List all providers (with optional search)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Partial name to search
 *     responses:
 *       200:
 *         description: List of providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Provider'
 *   post:
 *     summary: Create a new provider
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Provider'
 *     responses:
 *       201:
 *         description: Created provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Provider'
 * /api/providers/search:
 *   get:
 *     summary: Smart search for providers (top 10 prefix matches)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Prefix to search
 *     responses:
 *       200:
 *         description: List of matching providers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Provider'
 */
// GET /api/providers?q=
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const provs = await listProviders(accountId, q);
      res.status(200).json({ providers: provs });
    } catch (err: unknown) {
      logger.error('List providers error', { error: err });
      res.status(500).json({ message: (err as Error).message });
    }
  },
);

// POST /api/providers
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const { name, contactEmail, contactPhone } = req.body as {
        name: string;
        contactEmail: string;
        contactPhone: string;
      };
      const prov = await createProvider(accountId, {
        name,
        contactEmail,
        contactPhone,
      });
      res.status(201).json(prov);
    } catch (err: unknown) {
      logger.error('Create provider error', { error: err });
      res.status(400).json({ message: (err as Error).message });
    }
  },
);

// Smart search endpoint
router.get(
  '/search',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    const accountId = (req as ReqWithAuth).auth.accountId;
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    try {
      const results = await smartSearchProviders(accountId, q, 10);
      res.status(200).json(results);
    } catch (err: unknown) {
      logger.error('Provider smart search error', { error: err });
      res.status(500).json({ message: (err as Error).message });
    }
  },
);

// PUT /api/providers/:providerId
router.put(
  '/:providerId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.providerId);
      const { name, contactEmail, contactPhone } = req.body as Partial<{
        name: string;
        contactEmail: string;
        contactPhone: string;
      }>;
      const updated = await updateProvider(accountId, id, {
        name,
        contactEmail,
        contactPhone,
      });
      res.status(200).json(updated);
    } catch (err: unknown) {
      logger.error('Update provider error', { error: err });
      res.status(400).json({ message: (err as Error).message });
    }
  },
);

// DELETE /api/providers/:providerId
router.delete(
  '/:providerId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.providerId);
      await deleteProvider(accountId, id);
      res.status(204).end();
    } catch (err: unknown) {
      logger.error('Delete provider error', { error: err });
      res.status(400).json({ message: (err as Error).message });
    }
  },
);

export default router;
