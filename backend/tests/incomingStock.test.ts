// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/User';
import { Account } from '../src/entities/Account';
import { Provider } from '../src/entities/Provider';
import { Medicine } from '../src/entities/Medicine';
import { IncomingBill } from '../src/entities/IncomingBill';
import jwt from 'jsonwebtoken';

let token: string;
let account: Account;
let provider: Provider;
let medicine: Medicine;
let incomingBill: IncomingBill;
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
    username: 'instockadmin',
    passwordHash: 'hashed',
    fullName: 'InStock Admin',
    email: 'instockadmin@pharmacy.com',
    role: 'app_admin',
  });
  // Create test provider
  provider = await AppDataSource.getRepository(Provider).save({
    account: account,
    accountId: account.accountId,
    name: 'Test Provider',
    contactEmail: 'provider@pharmacy.com',
    contactPhone: '9876543210',
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
  // Create test incoming bill
  incomingBill = await AppDataSource.getRepository(IncomingBill).save({
    account: account,
    provider: provider,
    invoice_number: 'INV-001',
    invoice_date: '2025-07-01',
    payment_status: 'Paid',
    discount_total: 0,
    sgst_total: 0,
    cgst_total: 0,
    total_amount: 1000,
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

describe('IncomingStock API', () => {
  let stockId: number;
  it('should create an incoming stock', async () => {
    const res = await request(app)
      .post('/api/incoming-stocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        incomingBillId: incomingBill.incoming_bill_id,
        medicineId: medicine.medicineId,
        batchNumber: 'BATCH1',
        incomingDate: '2025-07-01',
        hsnCode: 'HSN123',
        quantityReceived: 10,
        unitCost: 10,
        discountLine: 0,
        freeQuantity: 0,
        expiryDate: '2026-07-01',
        accountId: account.accountId,
      });
    expect(res.status).toBe(201);
    expect(
      res.body.medicineStockId || res.body.medicineStock?.medicineStockId,
    ).toBeDefined();
    stockId =
      res.body.medicineStockId || res.body.medicineStock?.medicineStockId;
  });

  it('should merge with existing stock (same batch/incoming/expiry)', async () => {
    // Create the first stock entry
    await request(app)
      .post('/api/incoming-stocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        incomingBillId: incomingBill.incoming_bill_id,
        medicineId: medicine.medicineId,
        batchNumber: 'BATCH1',
        incomingDate: '2025-07-01',
        hsnCode: 'HSN123',
        quantityReceived: 10,
        unitCost: 10,
        discountLine: 0,
        freeQuantity: 0,
        expiryDate: '2026-07-01',
        accountId: account.accountId,
      });
    // Now send the second (merge) request
    const res = await request(app)
      .post('/api/incoming-stocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        incomingBillId: incomingBill.incoming_bill_id,
        medicineId: medicine.medicineId,
        batchNumber: 'BATCH1',
        incomingDate: '2025-07-01',
        hsnCode: 'HSN123',
        quantityReceived: 5,
        unitCost: 10,
        discountLine: 0,
        freeQuantity: 0,
        expiryDate: '2026-07-01',
        accountId: account.accountId,
      });
    expect(res.status).toBe(201);
    expect(res.body.quantityAvailable).toBe(15); // 10 + 5
  });

  it('should get all incoming stocks', async () => {
    const res = await request(app)
      .get('/api/incoming-stocks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should fail without auth', async () => {
    const res = await request(app).get('/api/incoming-stocks');
    expect(res.status).toBe(401);
  });

  it('should fail with missing required fields', async () => {
    const res = await request(app)
      .post('/api/incoming-stocks')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
