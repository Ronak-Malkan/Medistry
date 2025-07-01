import { AppDataSource } from '../data-source';
import { Patient } from '../entities/Patient';

export const patientRepository = AppDataSource.getRepository(Patient);
