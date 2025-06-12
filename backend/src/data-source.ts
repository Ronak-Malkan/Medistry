import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from './entities/Account';
import { User } from './entities/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [Account, User],
  migrations: [],
  subscribers: [],
});
