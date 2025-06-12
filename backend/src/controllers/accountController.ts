import { Router } from 'express';
const router = Router();

// GET /api/accounts
router.get('/', (_req, res) => {
  res.json({ accounts: [] }); // stub
});

export default router;
