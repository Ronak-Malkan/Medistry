import { AppDataSource } from '../data-source';
import { IncomingBill } from '../entities/IncomingBill';

export const incomingBillRepository = AppDataSource.getRepository(IncomingBill);
