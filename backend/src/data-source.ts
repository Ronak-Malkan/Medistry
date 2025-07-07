import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from './entities/Account';
import { User } from './entities/User';
import { Medicine } from './entities/Medicine';
import { Content } from './entities/Content';
import { Provider } from './entities/Provider';
import { IncomingBill } from './entities/IncomingBill';
import { IncomingStock } from './entities/IncomingStock';
import { Patient } from './entities/Patient';
import { Bill } from './entities/Bill';
import { SellingLog } from './entities/SellingLog';
import { MedicineContents } from './entities/MedicineContents';
import { Customer } from './entities/Customer';
import { MedicineStock } from './entities/MedicineStock';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [
    Account,
    User,
    Medicine,
    MedicineStock,
    Content,
    Provider,
    IncomingBill,
    IncomingStock,
    Patient,
    Bill,
    SellingLog,
    MedicineContents,
    Customer,
  ],
  migrations: [],
  subscribers: [],
});
