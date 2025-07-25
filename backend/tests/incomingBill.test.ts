// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/User';
import { Account } from '../src/entities/Account';
import { Provider } from '../src/entities/Provider';
import jwt from 'jsonwebtoken';

let token: string;
let account: Account;
let provider: Provider;

beforeAll(async () => {
  await AppDataSource.initialize();
});

beforeEach(async () => {
  if (process.env.NODE_ENV === 'test') {
    await AppDataSource.synchronize(true); // Reset test DB between runs
  }
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
    username: 'inbilladmin',
    passwordHash: 'hashed',
    fullName: 'InBill Admin',
    email: 'inbilladmin@pharmacy.com',
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

describe('IncomingBill API', () => {
  it('should create an incoming bill with multiple entries (existing and new medicines)', async () => {
    // Create an existing medicine
    const medRes = await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'BulkMedA', hsn: 'HSN1', contentIds: [] });
    const existingMedicineId = medRes.body.medicineId;

    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-001',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      entries: [
        {
          medicineId: existingMedicineId,
          batchNumber: 'BATCH1',
          incomingDate: '2025-07-01',
          expiryDate: '2026-07-01',
          quantity: 10,
          price: 100,
        },
        {
          name: 'BulkMedB',
          hsn: 'HSN2',
          batchNumber: 'BATCH2',
          incomingDate: '2025-07-01',
          expiryDate: '2026-07-01',
          quantity: 5,
          price: 200,
        },
      ],
    };
    const res = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.bill).toBeDefined();
    expect(res.body.stocks.length).toBe(2);
    expect(res.body.logs.length).toBe(2);
  });

  it('should fail to create a bill with missing entries', async () => {
    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-002',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      // entries missing
    };
    const res = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('should fail to create a bill with empty entries', async () => {
    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-003',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      entries: [],
    };
    const res = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('should fail to create a bill with invalid medicineId', async () => {
    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-004',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      entries: [
        {
          medicineId: 99999, // invalid
          batchNumber: 'BATCH1',
          incomingDate: '2025-07-01',
          expiryDate: '2026-07-01',
          quantity: 10,
          price: 100,
        },
      ],
    };
    const res = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('should require auth for creating a bill', async () => {
    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-005',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      entries: [
        {
          name: 'BulkMedC',
          hsn: 'HSN3',
          batchNumber: 'BATCH3',
          incomingDate: '2025-07-01',
          expiryDate: '2026-07-01',
          quantity: 5,
          price: 200,
        },
      ],
    };
    const res = await request(app).post('/api/incoming-bills').send(payload);
    expect(res.status).toBe(401);
  });

  it('should get all incoming bills', async () => {
    // Create a bill first
    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-006',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      entries: [
        {
          name: 'BulkMedD',
          hsn: 'HSN4',
          batchNumber: 'BATCH4',
          incomingDate: '2025-07-01',
          expiryDate: '2026-07-01',
          quantity: 5,
          price: 200,
        },
      ],
    };
    await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    const res = await request(app)
      .get('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get an incoming bill by id', async () => {
    // Create a bill first
    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-007',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      entries: [
        {
          name: 'BulkMedE',
          hsn: 'HSN5',
          batchNumber: 'BATCH5',
          incomingDate: '2025-07-01',
          expiryDate: '2026-07-01',
          quantity: 5,
          price: 200,
        },
      ],
    };
    const createRes = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    const billId = createRes.body.bill.incoming_bill_id;
    const res = await request(app)
      .get(`/api/incoming-bills/${billId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.incoming_bill_id).toBe(billId);
  });

  it('should update an incoming bill', async () => {
    // Create a bill first
    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-008',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      entries: [
        {
          name: 'BulkMedF',
          hsn: 'HSN6',
          batchNumber: 'BATCH6',
          incomingDate: '2025-07-01',
          expiryDate: '2026-07-01',
          quantity: 5,
          price: 200,
        },
      ],
    };
    const createRes = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    const billId = createRes.body.bill.incoming_bill_id;
    const res = await request(app)
      .put(`/api/incoming-bills/${billId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ total_amount: 2000 });
    expect(res.status).toBe(200);
    expect(res.body.total_amount).toBe('2000.00');
  });

  it('should return 404 for non-existent incoming bill', async () => {
    const res = await request(app)
      .get('/api/incoming-bills/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should delete an incoming bill', async () => {
    // Create a bill first
    const payload = {
      bill: {
        provider: provider.providerId,
        invoice_number: 'INV-009',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      },
      entries: [
        {
          name: 'BulkMedG',
          hsn: 'HSN7',
          batchNumber: 'BATCH7',
          incomingDate: '2025-07-01',
          expiryDate: '2026-07-01',
          quantity: 5,
          price: 200,
        },
      ],
    };
    const createRes = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    const billId = createRes.body.bill.incoming_bill_id;
    const res = await request(app)
      .delete(`/api/incoming-bills/${billId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('should return 404 when deleting non-existent incoming bill', async () => {
    const res = await request(app)
      .delete(`/api/incoming-bills/99999`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
