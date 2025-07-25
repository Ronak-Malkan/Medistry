// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { Account } from '../src/entities/Account';
import { User } from '../src/entities/User';
import { Medicine } from '../src/entities/Medicine';
import jwt from 'jsonwebtoken';
import { logger } from '../src/utils/logger';

let token: string;
let account: Account;
let user: User;
let medicineId: number;
let stockId: number;

// Helper to create a medicine stock batch
async function createMedicineStock(
  accountId: number,
  medicineId: number,
  batchNumber: string,
  quantityAvailable: number,
  expiryDate: string,
  incomingDate?: string,
) {
  const res = await request(app)
    .post('/api/medicine-stock')
    .set('Authorization', `Bearer ${token}`)
    .send({
      accountId,
      medicineId,
      batchNumber,
      quantityAvailable,
      expiryDate,
      incomingDate: incomingDate || '2025-01-01',
    });
  return res.body.medicineStockId || res.body.id;
}

describe('Medicine Stock Controller (/medicine-stock)', () => {
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
    user = await AppDataSource.getRepository(User).save({
      account: account,
      username: 'stockadmin',
      passwordHash: 'hashed',
      fullName: 'Stock Admin',
      email: 'stockadmin@pharmacy.com',
      role: 'app_admin',
    });
    // Generate JWT
    token = jwt.sign(
      { userId: user.userId, accountId: account.accountId, role: user.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' },
    );
    // Create a medicine for use in tests
    const medicine = await AppDataSource.getRepository(Medicine).save({
      name: 'Paracetamol',
    });
    medicineId = medicine.medicineId;
    logger.info(
      'MedicineStockController.test in beforeAll • medicineId:',
      medicineId,
    );
  });

  describe('POST /medicine-stock', () => {
    it('should create a new medicine stock entry', async () => {
      logger.info(
        'MedicineStockController.test inside describe • medicineId:',
        medicineId,
      );
      const res = await request(app)
        .post('/api/medicine-stock')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: account.accountId,
          medicineId,
          batchNumber: 'BATCH001',
          quantityAvailable: 100,
          expiryDate: '2025-12-31',
          incomingDate: '2025-01-01',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('medicineStockId');
      expect(res.body.medicineId).toBe(medicineId);
      expect(res.body.batchNumber).toBe('BATCH001');
      expect(res.body.quantityAvailable).toBe(100);
      expect(res.body.expiryDate).toBe('2025-12-31');
      expect(res.body.incomingDate).toBe('2025-01-01');
      stockId = res.body.medicineStockId;
    });

    it('should not create stock for non-existent medicine', async () => {
      const res = await request(app)
        .post('/api/medicine-stock')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: account.accountId,
          medicineId: 99999,
          batchNumber: 'BATCH002',
          quantityAvailable: 50,
          expiryDate: '2025-12-31',
          incomingDate: '2025-01-01',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /medicine-stock/:id', () => {
    it('should update an existing medicine stock entry', async () => {
      // Create a stock entry first
      const newStockId = await createMedicineStock(
        account.accountId,
        medicineId,
        'BATCHUPD',
        50,
        '2025-12-31',
        '2025-01-01',
      );
      const res = await request(app)
        .put(`/api/medicine-stock/${newStockId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantityAvailable: 80 });
      expect(res.status).toBe(200);
      expect(res.body.quantityAvailable).toBe(80);
    });

    it('should return 404 for non-existent stock', async () => {
      const res = await request(app)
        .put('/api/medicine-stock/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantityAvailable: 10 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /medicine-stock/:id', () => {
    it('should delete a medicine stock entry', async () => {
      const newStockId = await createMedicineStock(
        account.accountId,
        medicineId,
        'BATCHDEL',
        10,
        '2026-01-01',
        '2025-01-01',
      );
      const res = await request(app)
        .delete(`/api/medicine-stock/${newStockId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent stock', async () => {
      const res = await request(app)
        .delete('/api/medicine-stock/99999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /medicine-stock/search', () => {
    beforeEach(async () => {
      // Add multiple batches for search tests
      await createMedicineStock(
        account.accountId,
        medicineId,
        'BATCHA',
        20,
        '2024-12-31',
        '2024-01-01',
      );
      await createMedicineStock(
        account.accountId,
        medicineId,
        'BATCHB',
        30,
        '2024-11-30',
        '2024-01-01',
      );
      await createMedicineStock(
        account.accountId,
        medicineId,
        'BATCHC',
        40,
        '2025-01-31',
        '2024-01-01',
      );
    });

    it('should return top 15 in-stock medicines matching prefix, sorted by expiry', async () => {
      const res = await request(app)
        .get('/api/medicine-stock/search')
        .set('Authorization', `Bearer ${token}`)
        .query({ prefix: 'Para', accountId: account.accountId });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeLessThanOrEqual(15);
      // Should be sorted by expiry ascending
      for (let i = 1; i < res.body.length; i++) {
        expect(
          new Date(res.body[i].expiryDate) >=
            new Date(res.body[i - 1].expiryDate),
        ).toBe(true);
      }
      // Should include medicine and stock info
      expect(res.body[0]).toHaveProperty('medicine');
      expect(res.body[0]).toHaveProperty('batchNumber');
    });

    it('should return empty array if no stock matches', async () => {
      const res = await request(app)
        .get('/api/medicine-stock/search')
        .set('Authorization', `Bearer ${token}`)
        .query({ prefix: 'Nonexistent', accountId: account.accountId });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /medicine-stock/searchall', () => {
    beforeEach(async () => {
      // Add multiple batches for searchall tests
      await createMedicineStock(
        account.accountId,
        medicineId,
        'BATCHA',
        20,
        '2024-12-31',
        '2024-01-01',
      );
      await createMedicineStock(
        account.accountId,
        medicineId,
        'BATCHB',
        30,
        '2024-11-30',
        '2024-01-01',
      );
      await createMedicineStock(
        account.accountId,
        medicineId,
        'BATCHC',
        40,
        '2025-01-31',
        '2024-01-01',
      );
    });
    it('should return all in-stock medicines matching prefix, sorted by expiry', async () => {
      const res = await request(app)
        .get('/api/medicine-stock/searchall')
        .set('Authorization', `Bearer ${token}`)
        .query({ prefix: 'Para', accountId: account.accountId });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should be sorted by expiry ascending
      for (let i = 1; i < res.body.length; i++) {
        expect(
          new Date(res.body[i].expiryDate) >=
            new Date(res.body[i - 1].expiryDate),
        ).toBe(true);
      }
      // Should include medicine and stock info
      expect(res.body[0]).toHaveProperty('medicine');
      expect(res.body[0]).toHaveProperty('batchNumber');
    });
  });
});
