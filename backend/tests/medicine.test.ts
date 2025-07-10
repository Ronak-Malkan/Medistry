// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { Account } from '../src/entities/Account';
import { User } from '../src/entities/User';
import jwt from 'jsonwebtoken';
import { Content } from '../src/entities/Content';

let token: string;
let account: Account;
let user: User;
let medicineId: number;

// Helper to create a medicine
async function createMedicine(accountId: number, name: string, hsn?: string) {
  const res = await request(app)
    .post('/api/medicines/master')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name,
      hsn,
    });
  return res.body.medicineId || res.body.id;
}

describe('Medicine Controller (/api/medicines/master)', () => {
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
    user = await AppDataSource.getRepository(User).save({
      account: account,
      username: 'medadmin',
      passwordHash: 'hashed',
      fullName: 'Med Admin',
      email: 'medadmin@pharmacy.com',
      role: 'app_admin',
    });
    // Generate JWT
    token = jwt.sign(
      { userId: user.userId, accountId: account.accountId, role: user.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' },
    );
  });

  it('should create a new medicine', async () => {
    const res = await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ibuprofen', hsn: 'HSN123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('medicineId');
    expect(res.body.name).toBe('Ibuprofen');
    expect(res.body.hsn).toBe('HSN123');
    medicineId = res.body.medicineId;
  });

  it('should create a medicine with contents', async () => {
    // Create contents
    const contentA = await AppDataSource.getRepository(Content).save({
      name: 'Paracetamol',
    });
    const contentB = await AppDataSource.getRepository(Content).save({
      name: 'Caffeine',
    });
    const res = await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Dolo Plus',
        hsn: 'HSN321',
        contents: [contentA.contentId, contentB.contentId],
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('medicineId');
    expect(res.body.contents.length).toBe(2);
    expect(res.body.contents.map((c) => c.contentId)).toEqual(
      expect.arrayContaining([contentA.contentId, contentB.contentId]),
    );
  });

  it('should update a medicine and its contents', async () => {
    const contentA = await AppDataSource.getRepository(Content).save({
      name: 'Paracetamol',
    });
    const contentB = await AppDataSource.getRepository(Content).save({
      name: 'Caffeine',
    });
    const medRes = await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dolo', hsn: 'HSN111', contents: [contentA.contentId] });
    const medId = medRes.body.medicineId;
    const updateRes = await request(app)
      .put(`/api/medicines/master/${medId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ contents: [contentA.contentId, contentB.contentId] });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.contents.length).toBe(2);
    expect(updateRes.body.contents.map((c) => c.contentId)).toEqual(
      expect.arrayContaining([contentA.contentId, contentB.contentId]),
    );
  });

  it('should return top 15 medicines matching prefix (smart search)', async () => {
    await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Paracetamol', hsn: 'HSN001' });
    await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Paracip', hsn: 'HSN002' });
    await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ibuprofen', hsn: 'HSN003' });
    const res = await request(app)
      .get('/api/medicines/search?prefix=Para')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(15);
    expect(res.body[0].name).toMatch(/^Para/i);
  });

  it('should return all medicines matching prefix (smart search all)', async () => {
    await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Paracetamol', hsn: 'HSN001' });
    await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Paracip', hsn: 'HSN002' });
    await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ibuprofen', hsn: 'HSN003' });
    const res = await request(app)
      .get('/api/medicines/searchall?prefix=Para')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0].name).toMatch(/^Para/i);
  });

  it('should not allow duplicate medicine names', async () => {
    await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'UniqueMed', hsn: 'HSN123' });
    const res = await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'UniqueMed', hsn: 'HSN999' });
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid content IDs', async () => {
    const res = await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'InvalidContentMed', hsn: 'HSN123', contents: [99999] });
    expect(res.status).toBe(400);
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`)
      .send({ hsn: 'HSN123' });
    expect(res.status).toBe(400);
  });

  it('should list all medicines', async () => {
    await createMedicine(account.accountId, 'Paracetamol', 'HSN001');
    await createMedicine(account.accountId, 'Ibuprofen', 'HSN002');
    const res = await request(app)
      .get('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.medicines)).toBe(true);
    expect(res.body.medicines.length).toBeGreaterThanOrEqual(2);
    expect(res.body.medicines[0]).toHaveProperty('medicineId');
    expect(res.body.medicines[0]).toHaveProperty('name');
  });

  it('should update a medicine', async () => {
    const id = await createMedicine(account.accountId, 'Aspirin', 'HSN003');
    const res = await request(app)
      .put(`/api/medicines/master/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Aspirin Updated', hsn: 'HSN004' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Aspirin Updated');
    expect(res.body.hsn).toBe('HSN004');
  });

  it('should delete a medicine', async () => {
    const id = await createMedicine(account.accountId, 'ToDelete', 'HSN999');
    const res = await request(app)
      .delete(`/api/medicines/master/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    // Should not find it anymore
    const listRes = await request(app)
      .get('/api/medicines/master')
      .set('Authorization', `Bearer ${token}`);
    expect(
      listRes.body.medicines.find((m) => m.medicineId === id),
    ).toBeUndefined();
  });
});
