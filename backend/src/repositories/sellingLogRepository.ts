import { AppDataSource } from '../data-source';
import { SellingLog } from '../entities/SellingLog';

export const sellingLogRepository = AppDataSource.getRepository(SellingLog);
