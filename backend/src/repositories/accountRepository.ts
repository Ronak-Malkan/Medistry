import { Repository } from 'typeorm';
import { Account } from '../entities/Account';
import { AppDataSource } from '../data-source';

export const accountRepository: Repository<Account> =
  AppDataSource.getRepository(Account);
