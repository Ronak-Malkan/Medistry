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
  it('should create an incoming bill', async () => {
    const res = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: { providerId: provider.providerId },
        invoice_number: 'INV-001',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      });
    expect(res.status).toBe(201);
    expect(res.body.incoming_bill_id).toBeDefined();
  });

  it('should get all incoming bills', async () => {
    // Create a bill first
    await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: { providerId: provider.providerId },
        invoice_number: 'INV-001',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      });
    const res = await request(app)
      .get('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get an incoming bill by id', async () => {
    // Create a bill first
    const createRes = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: { providerId: provider.providerId },
        invoice_number: 'INV-001',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      });
    const billId = createRes.body.incoming_bill_id;
    const res = await request(app)
      .get(`/api/incoming-bills/${billId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.incoming_bill_id).toBe(billId);
  });

  it('should update an incoming bill', async () => {
    // Create a bill first
    const createRes = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: { providerId: provider.providerId },
        invoice_number: 'INV-001',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      });
    const billId = createRes.body.incoming_bill_id;
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
    const createRes = await request(app)
      .post('/api/incoming-bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: { providerId: provider.providerId },
        invoice_number: 'INV-001',
        invoice_date: '2025-07-01',
        payment_status: 'Paid',
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
        total_amount: 1000,
      });
    const billId = createRes.body.incoming_bill_id;
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

  it('should fail without auth', async () => {
    const res = await request(app).get('/api/incoming-bills');
    expect(res.status).toBe(401);
  });
});
