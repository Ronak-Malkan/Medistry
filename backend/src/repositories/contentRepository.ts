import { AppDataSource } from '../data-source';
import { Content } from '../entities/Content';

// Single source of truth for Content table operations
export const contentRepository = AppDataSource.getRepository(Content);
