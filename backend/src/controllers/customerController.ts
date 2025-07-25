import { Router, Request, Response } from 'express';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
  smartSearchCustomers,
  smartSearchAllCustomers,
} from '../services/customerService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

interface ReqWithAuth extends Request {
  auth: { accountId: number; role: string };
}

const router = Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: List all customers (with optional search)
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
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *   post:
 *     summary: Create a new customer
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
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 * /api/customers/search:
 *   get:
 *     summary: Smart search for customers (top 10 prefix matches)
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
 *         description: List of matching customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 * /api/customers/searchall:
 *   get:
 *     summary: Smart search for all customers (all prefix matches)
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
 *         description: List of matching customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 */

// GET /api/customers?q=
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const customers = await listCustomers(accountId, q);
      res.status(200).json({ customers });
    } catch (err: unknown) {
      logger.error('List customers error', { error: err });
      res.status(500).json({ message: (err as Error).message });
    }
  },
);

// POST /api/customers
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const { name, phone, address } = req.body as {
        name: string;
        phone?: string;
        address?: string;
      };
      const customer = await createCustomer(accountId, {
        name,
        phone,
        address,
      });
      res.status(201).json(customer);
    } catch (err: unknown) {
      logger.error('Create customer error', { error: err });
      res.status(400).json({ message: (err as Error).message });
    }
  },
);

// Smart search endpoint (top 10)
router.get(
  '/search',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    const accountId = (req as ReqWithAuth).auth.accountId;
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    try {
      const results = await smartSearchCustomers(accountId, q, 10);
      res.status(200).json(results);
    } catch (err: unknown) {
      logger.error('Customer smart search error', { error: err });
      res.status(500).json({ message: (err as Error).message });
    }
  },
);

// Smart search all endpoint
router.get(
  '/searchall',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    const accountId = (req as ReqWithAuth).auth.accountId;
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    try {
      const results = await smartSearchAllCustomers(accountId, q);
      res.status(200).json(results);
    } catch (err: unknown) {
      logger.error('Customer smart search all error', { error: err });
      res.status(500).json({ message: (err as Error).message });
    }
  },
);

// GET /api/customers/:customerId
router.get(
  '/:customerId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.customerId);
      const customer = await getCustomerById(accountId, id);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.status(200).json(customer);
    } catch (err: unknown) {
      logger.error('Get customer error', { error: err });
      res.status(500).json({ message: (err as Error).message });
    }
  },
);

// PUT /api/customers/:customerId
router.put(
  '/:customerId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.customerId);
      const { name, phone, address } = req.body as Partial<{
        name: string;
        phone: string;
        address: string;
      }>;
      const updated = await updateCustomer(accountId, id, {
        name,
        phone,
        address,
      });
      res.status(200).json(updated);
    } catch (err: unknown) {
      logger.error('Update customer error', { error: err });
      res.status(400).json({ message: (err as Error).message });
    }
  },
);

// DELETE /api/customers/:customerId
router.delete(
  '/:customerId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as ReqWithAuth).auth.accountId;
      const id = Number(req.params.customerId);
      await deleteCustomer(accountId, id);
      res.status(204).end();
    } catch (err: unknown) {
      logger.error('Delete customer error', { error: err });
      res.status(400).json({ message: (err as Error).message });
    }
  },
);

export default router;
