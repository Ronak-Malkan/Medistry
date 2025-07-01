import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import authRouter from './controllers/authController';
import accountRouter from './controllers/accountController';
import userRouter from './controllers/userController';
import contentRouter from './controllers/contentController';
import medicineRouter from './controllers/medicineController';
import providerRouter from './controllers/providerController';
import billRouter from './controllers/billController';
import incomingBillRouter from './controllers/incomingBillController';
import incomingStockRouter from './controllers/incomingStockController';
import sellingLogRouter from './controllers/sellingLogController';
import medicineContentsRouter from './controllers/medicineContentsController';
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
app.use('/api/contents', contentRouter);
app.use('/api/medicines', medicineRouter);
app.use('/api/providers', providerRouter);
app.use('/api/bills', billRouter);
app.use('/api/incoming-bills', incomingBillRouter);
app.use('/api/incoming-stocks', incomingStockRouter);
app.use('/api/selling-logs', sellingLogRouter);
app.use('/api/medicine-contents', medicineContentsRouter);
