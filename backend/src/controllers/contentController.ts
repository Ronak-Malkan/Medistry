import { Router, Request, Response } from 'express';
import {
  listContents,
  createContent,
  updateContent,
  deleteContent,
  smartSearchContents,
  smartSearchAllContents,
} from '../services/contentService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/contents:
 *   get:
 *     summary: List all contents (with optional search)
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
 *         description: List of contents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *   post:
 *     summary: Create a new content
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
 *     responses:
 *       201:
 *         description: Created content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 * /api/contents/{id}:
 *   put:
 *     summary: Update a content
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
 *     responses:
 *       200:
 *         description: Updated content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *   delete:
 *     summary: Delete a content
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
 * /api/contents/search:
 *   get:
 *     summary: Smart search for contents (top 15 prefix matches)
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
 *         description: List of matching contents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Content'
 * /api/contents/searchall:
 *   get:
 *     summary: Smart search for all contents (all prefix matches)
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
 *         description: List of matching contents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Content'
 */
/** GET /api/contents?q=&r → { contents: Content[] } */
router.get(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const contents = await listContents(q);
      res.status(200).json({ contents });
    } catch (err: unknown) {
      logger.error('List content error', { error: err });
      res.status(500).json({ message: (err as Error).message || 'Failed' });
    }
  },
);

/** POST /api/contents → { contentId, name } */
router.post(
  '/',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const { name } = req.body as { name: string };
      const content = await createContent(name);
      res.status(201).json(content);
    } catch (err: unknown) {
      logger.error('Create content error', { error: err });
      res.status(400).json({ message: (err as Error).message || 'Failed' });
    }
  },
);

/** PUT /api/contents/:contentId → { contentId, name } */
router.put(
  '/:contentId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.contentId);
      const { name } = req.body as { name: string };
      const updated = await updateContent(id, name);
      res.status(200).json(updated);
    } catch (err: unknown) {
      logger.error('Update content error', { error: err });
      res.status(400).json({ message: (err as Error).message || 'Failed' });
    }
  },
);

/** DELETE /api/contents/:contentId → 204 */
router.delete(
  '/:contentId',
  requireRole('app_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.contentId);
      await deleteContent(id);
      res.status(204).end();
    } catch (err: unknown) {
      logger.error('Delete content error', { error: err });
      res.status(400).json({ message: (err as Error).message || 'Failed' });
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
      const results = await smartSearchContents(prefix, 15);
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
      const results = await smartSearchAllContents(prefix);
      res.json(results);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },
);

export default router;
