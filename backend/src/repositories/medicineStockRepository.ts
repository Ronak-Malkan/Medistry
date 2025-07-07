import { AppDataSource } from '../data-source';
import { MedicineStock } from '../entities/MedicineStock';

export const medicineStockRepository =
  AppDataSource.getRepository(MedicineStock);
