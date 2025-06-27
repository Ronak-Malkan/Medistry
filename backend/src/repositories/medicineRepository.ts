import { AppDataSource } from '../data-source';
import { Medicine } from '../entities/Medicine';

export const medicineRepository = AppDataSource.getRepository(Medicine);
