import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';

export const userRepository: Repository<User> =
  AppDataSource.getRepository(User);
