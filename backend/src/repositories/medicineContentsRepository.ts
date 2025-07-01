import { AppDataSource } from '../data-source';
import { MedicineContents } from '../entities/MedicineContents';

export const medicineContentsRepository =
  AppDataSource.getRepository(MedicineContents);
