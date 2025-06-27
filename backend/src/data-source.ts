import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from './entities/Account';
import { User } from './entities/User';
import { Medicine } from './entities/Medicine';
import { Content } from './entities/Content';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [Account, User, Medicine, Content],
  migrations: [],
  subscribers: [],
});
