import { AppDataSource } from '../data-source';
import { Bill } from '../entities/Bill';

export const billRepository = AppDataSource.getRepository(Bill);
