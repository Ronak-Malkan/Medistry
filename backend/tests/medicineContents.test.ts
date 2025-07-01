// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/User';
import { Account } from '../src/entities/Account';
import { Medicine } from '../src/entities/Medicine';
import { Content } from '../src/entities/Content';
import jwt from 'jsonwebtoken';

let token: string;
let account: Account;
let medicine: Medicine;
let content: Content;

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
    username: 'medcontentadmin',
    passwordHash: 'hashed',
    fullName: 'MedContent Admin',
    email: 'medcontentadmin@pharmacy.com',
    role: 'app_admin',
  });
  // Create test content
  content = await AppDataSource.getRepository(Content).save({
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
    quantityAvailable: 10,
    price: 100,
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

describe('MedicineContents API', () => {
  it('should add a content to medicine', async () => {
    const res = await request(app)
      .post('/api/medicine-contents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicine_id: medicine.medicineId,
        content_id: content.contentId,
      });
    expect(res.status).toBe(201);
    expect(res.body.medicine_id).toBe(medicine.medicineId);
    expect(res.body.content_id).toBe(content.contentId);
  });

  it('should fail to add with missing fields', async () => {
    const res = await request(app)
      .post('/api/medicine-contents')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('should remove a content from medicine', async () => {
    const res = await request(app)
      .delete('/api/medicine-contents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicine_id: medicine.medicineId,
        content_id: content.contentId,
      });
    expect(res.status).toBe(204);
  });

  it('should fail to remove with missing fields', async () => {
    const res = await request(app)
      .delete('/api/medicine-contents')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('should fail without auth', async () => {
    const res = await request(app).post('/api/medicine-contents').send({
      medicine_id: medicine.medicineId,
      content_id: content.contentId,
    });
    expect(res.status).toBe(401);
  });
});
