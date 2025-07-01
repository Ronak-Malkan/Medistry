// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/User';
import { Account } from '../src/entities/Account';
import { Patient } from '../src/entities/Patient';
import jwt from 'jsonwebtoken';

let token: string;
let account: Account;
let patient: Patient;

beforeAll(async () => {
  await AppDataSource.initialize();
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
    username: 'billadmin',
    passwordHash: 'hashed',
    fullName: 'Bill Admin',
    email: 'billadmin@pharmacy.com',
    role: 'app_admin',
  });
  // Create test patient
  patient = await AppDataSource.getRepository(Patient).save({
    account: account,
    name: 'Test Patient',
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

describe('Bill API', () => {
  let billId: number;
  it('should create a bill', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patient_id: patient.patient_id,
        bill_date: '2025-07-01',
        total_amount: 100,
        discount_total: 0,
        sgst_total: 0,
        cgst_total: 0,
      });
    expect(res.status).toBe(201);
    expect(res.body.bill_id).toBeDefined();
    billId = res.body.bill_id;
  });

  it('should get all bills', async () => {
    const res = await request(app)
      .get('/api/bills')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get a bill by id', async () => {
    const res = await request(app)
      .get(`/api/bills/${billId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.bill_id).toBe(billId);
  });

  it('should update a bill', async () => {
    const res = await request(app)
      .put(`/api/bills/${billId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ total_amount: 150 });
    expect(res.status).toBe(200);
    expect(res.body.total_amount).toBe('150.00');
  });

  it('should return 404 for non-existent bill', async () => {
    const res = await request(app)
      .get('/api/bills/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should delete a bill', async () => {
    const res = await request(app)
      .delete(`/api/bills/${billId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('should return 404 when deleting non-existent bill', async () => {
    const res = await request(app)
      .delete(`/api/bills/${billId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should fail without auth', async () => {
    const res = await request(app).get('/api/bills');
    expect(res.status).toBe(401);
  });
});
