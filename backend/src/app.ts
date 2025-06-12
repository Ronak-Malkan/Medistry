import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import authRouter from './controllers/authController';
import accountRouter from './controllers/accountController';
import userRouter from './controllers/userController';
import { jwtMiddleware } from './middleware/auth';

export const app = express();

app.use(cors());
app.use(express.json());

// Public routes
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);

// Protected routes
app.use('/api', jwtMiddleware);
app.use('/api/accounts', accountRouter);
app.use('/api/users', userRouter);
