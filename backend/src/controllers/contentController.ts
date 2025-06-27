import { Router, Request, Response } from 'express';
import {
  listContents,
  createContent,
  updateContent,
  deleteContent,
} from '../services/contentService';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

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

export default router;
