// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/User';
import { Account } from '../src/entities/Account';
import { Medicine } from '../src/entities/Medicine';
import { Bill } from '../src/entities/Bill';
import jwt from 'jsonwebtoken';

let token: string;
let account: Account;
let medicine: Medicine;
let bill: Bill;
let medicineStockId: number;

beforeAll(async () => {
  await AppDataSource.initialize();
});

beforeEach(async () => {
  await AppDataSource.synchronize(true);
  // Create test account
  account = await AppDataSource.getRepository(Account).save({
    name: 'Test Pharmacy',
    drugLicenseNumber: 'DL123',
    address: '123 Main St',
    contactEmail: 'test@pharmacy.com',
    contactPhone: '1234567890',
    lowStockThreshold: 5,
    expiryAlertLeadTime: 30,
  });
  // Create test user
  const user = await AppDataSource.getRepository(User).save({
    account: account,
    username: 'selladmin',
    passwordHash: 'hashed',
    fullName: 'Sell Admin',
    email: 'selladmin@pharmacy.com',
    role: 'app_admin',
  });
  // Create test content
  const content = await AppDataSource.getRepository(
    require('../src/entities/Content').Content,
  ).save({
    name: 'Paracetamol',
    account: account,
    accountId: account.accountId,
  });
  // Create master medicine
  medicine = await AppDataSource.getRepository(Medicine).save({
    name: 'TestMed',
    hsn: 'HSN123',
    contents: [content],
  });
  // Create medicine stock
  const stock = await AppDataSource.getRepository(
    require('../src/entities/MedicineStock').MedicineStock,
  ).save({
    medicine: medicine,
    medicineId: medicine.medicineId,
    batchNumber: 'BATCH1',
    incomingDate: '2025-07-01',
    expiryDate: '2026-07-01',
    quantityAvailable: 10,
    price: '100',
    accountId: account.accountId,
    account: account,
  });
  medicineStockId = stock.medicineStockId;
  // Create test patient
  const patient = await AppDataSource.getRepository(
    require('../src/entities/Patient').Patient,
  ).save({
    account: account,
    accountId: account.accountId,
    name: 'Test Patient',
  });
  // Create test bill
  bill = await AppDataSource.getRepository(Bill).save({
    account: account,
    patient: patient,
    bill_date: '2025-07-01',
    total_amount: 100,
    discount_total: 0,
    sgst_total: 0,
    cgst_total: 0,
  });
  // Generate JWT
  token = jwt.sign(
    { userId: user.userId, accountId: account.accountId, role: user.role },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' },
  );
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('SellingLog API', () => {
  let logId: number;
  it('should create a selling log (decrement stock)', async () => {
    const res = await request(app)
      .post('/api/selling-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        billId: bill.bill_id,
        medicineId: medicine.medicineId,
        batchNumber: 'BATCH1',
        quantitySold: 5,
        discountLine: 0,
        unitPriceInclusiveGst: 120,
        hsnCode: 'HSN123',
        expiryDate: '2026-07-01',
        accountId: account.accountId,
      });
    expect(res.status).toBe(201);
    expect(res.body.selling_log_id).toBeDefined();
    logId = res.body.selling_log_id;
  });

  it('should fail if selling more than available', async () => {
    const res = await request(app)
      .post('/api/selling-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        billId: bill.bill_id,
        medicineId: medicine.medicineId,
        batchNumber: 'BATCH1',
        quantitySold: 100,
        discountLine: 0,
        unitPriceInclusiveGst: 120,
        hsnCode: 'HSN123',
        expiryDate: '2026-07-01',
        accountId: account.accountId,
      });
    expect(res.status).toBe(400);
  });

  it('should get all selling logs', async () => {
    const res = await request(app)
      .get('/api/selling-logs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should fail without auth', async () => {
    const res = await request(app).get('/api/selling-logs');
    expect(res.status).toBe(401);
  });
});
