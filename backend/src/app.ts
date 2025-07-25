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
import patientRouter from './controllers/patientController';
import medicineStockRouter from './controllers/medicineStockController';
import customerRouter from './controllers/customerController';
import { jwtMiddleware } from './middleware/auth';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

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
app.use('/api/patients', patientRouter);
app.use('/api/medicine-stock', medicineStockRouter);
app.use('/api/customers', customerRouter);

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Medistry API',
    version: '1.0.0',
    description:
      'API documentation for Medistry backend (current endpoints only, bill types deferred)',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/controllers/*.ts'],
};
const swaggerSpec = swaggerJSDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
