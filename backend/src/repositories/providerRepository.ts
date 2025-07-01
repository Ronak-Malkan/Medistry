import { AppDataSource } from '../data-source';
import { Provider } from '../entities/Provider';

export const providerRepository = AppDataSource.getRepository(Provider);
