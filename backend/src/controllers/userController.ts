import { Router } from 'express';
const router = Router();

// GET /api/users
router.get('/', (_req, res) => {
  res.json({ users: [] }); // stub
});

export default router;
