import { Router } from 'express';
import { registerCompany, loginUser } from '../services/authService';
import { logger } from '../utils/logger';

const router = Router();

router.post('/company/register', async (req, res) => {
  try {
    const token = await registerCompany(req.body.company, req.body.admin);
    res.status(201).json({ token });
  } catch (err: unknown) {
    logger.error('Company registration error', { error: err });
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, loginAs } = req.body;
    const token = await loginUser(username, password, loginAs);
    res.status(200).json({ token });
  } catch (err: unknown) {
    logger.error('Login error', { error: err });
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ message });
  }
});

export default router;
