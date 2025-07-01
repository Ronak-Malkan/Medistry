import { AppDataSource } from '../data-source';
import { IncomingStock } from '../entities/IncomingStock';

export const incomingStockRepository =
  AppDataSource.getRepository(IncomingStock);
