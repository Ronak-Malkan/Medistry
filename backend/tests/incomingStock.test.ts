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
  // Create test medicine
  medicine = await AppDataSource.getRepository(Medicine).save({
    account: account,
    accountId: account.accountId,
    name: 'TestMed',
    content: content,
    contentId: content.contentId,
    batchNumber: 'BATCH1',
    incomingDate: '2025-07-01',
    expiryDate: '2026-07-01',
    quantityAvailable: 0,
    price: 100,
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
        incomingBill: { incoming_bill_id: incomingBill.incoming_bill_id },
        medicine: { medicineId: medicine.medicineId },
        batch_number: 'BATCH1',
        incoming_date: '2025-07-01',
        hsn_code: 'HSN123',
        quantity_received: 10,
        unit_cost: 10,
        discount_line: 0,
        free_quantity: 0,
        expiry_date: '2026-07-01',
      });
    expect(res.status).toBe(201);
    expect(res.body.incoming_stock_id).toBeDefined();
    stockId = res.body.incoming_stock_id;
  });

  it('should merge with existing stock (same batch/incoming/expiry)', async () => {
    // Create the first stock entry
    await request(app)
      .post('/api/incoming-stocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        incomingBill: { incoming_bill_id: incomingBill.incoming_bill_id },
        medicine: { medicineId: medicine.medicineId },
        batch_number: 'BATCH1',
        incoming_date: '2025-07-01',
        hsn_code: 'HSN123',
        quantity_received: 10,
        unit_cost: 10,
        discount_line: 0,
        free_quantity: 0,
        expiry_date: '2026-07-01',
      });
    // Now send the second (merge) request
    const res = await request(app)
      .post('/api/incoming-stocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        incomingBill: { incoming_bill_id: incomingBill.incoming_bill_id },
        medicine: { medicineId: medicine.medicineId },
        batch_number: 'BATCH1',
        incoming_date: '2025-07-01',
        hsn_code: 'HSN123',
        quantity_received: 5,
        unit_cost: 10,
        discount_line: 0,
        free_quantity: 0,
        expiry_date: '2026-07-01',
      });
    expect(res.status).toBe(201);
    expect(res.body.quantity_received).toBe(15); // 10 + 5
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
