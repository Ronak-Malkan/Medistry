// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';

interface AuthResponse {
  token: string;
}

let adminToken: string, userToken: string;
let med1Id: number, med2Id: number, stock1Id: number, stock2Id: number;
let testContentId: number;

const uniqueSuffix = Date.now();
const masterMedName1 = `MedA_${uniqueSuffix}`;
const masterMedName2 = `MedB_${uniqueSuffix}`;

const companyPayload = {
  company: {
    name: 'TestCo',
    drugLicenseNumber: 'DL123',
    address: '123 Main St',
    contactEmail: 'contact@test.co',
    contactPhone: '1234567890',
    lowStockThreshold: 5,
    expiryAlertLeadTime: 10,
  },
  admin: {
    username: 'alice',
    password: 'Secret123!',
    fullName: 'Alice Smith',
    email: 'alice@test.co',
  },
};
const appAdmin = {
  username: 'carol',
  password: 'Carol123!',
  fullName: 'Carol Doc',
  email: 'carol@test.co',
  role: 'app_admin' as const,
};

beforeAll(async () => {
  await AppDataSource.initialize();
  await AppDataSource.synchronize(true);
  const reg = await request(app)
    .post('/auth/company/register')
    .send(companyPayload);
  adminToken = reg.body.token;
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(appAdmin);
  const log = await request(app).post('/auth/login').send({
    username: appAdmin.username,
    password: appAdmin.password,
    loginAs: 'user',
  });
  userToken = log.body.token;
  // Create one Content entry for medicines to reference
  const contentRes = await request(app)
    .post('/api/contents')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'TestMedContent' })
    .expect(201);
  testContentId = contentRes.body.contentId;
}, 20000);

afterAll(() => AppDataSource.destroy());

describe('Medicine CRUD & Merge Logic', () => {
  it('POST new master medicine and then create stock', async () => {
    // Create master medicine
    const masterDto = {
      name: masterMedName1,
      hsn: 'HSN1',
      contentIds: [testContentId],
    };
    const r1 = await request(app)
      .post('/api/medicines/master')
      .set('Authorization', `Bearer ${userToken}`)
      .send(masterDto)
      .expect(201);
    med1Id = r1.body.medicineId;
    expect(r1.body.name).toBe(masterMedName1);
    // Create stock for this medicine
    const stockDto = {
      medicineId: med1Id,
      batchNumber: 'BN1',
      incomingDate: '2025-01-01',
      expiryDate: '2025-12-31',
      quantityAvailable: 10,
      price: '12.50',
    };
    const r2 = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .send(stockDto)
      .expect(201);
    stock1Id = r2.body.medicineStockId;
    expect(r2.body.quantityAvailable).toBe(10);
  });

  it('POST another stock for same medicine and merge batch', async () => {
    // Add more to the same batch
    const stockDto = {
      medicineId: med1Id,
      batchNumber: 'BN1',
      incomingDate: '2025-01-01',
      expiryDate: '2025-12-31',
      quantityAvailable: 5,
      price: '12.50',
    };
    const r = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .send(stockDto)
      .expect(201);
    expect(r.body.medicineStockId).toBe(stock1Id);
    expect(r.body.quantityAvailable).toBe(15);
  });

  it('POST a different batch for same medicine', async () => {
    const stockDto = {
      medicineId: med1Id,
      batchNumber: 'BN2',
      incomingDate: '2025-01-01',
      expiryDate: '2025-12-31',
      quantityAvailable: 7,
      price: '12.50',
    };
    const r = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .send(stockDto)
      .expect(201);
    stock2Id = r.body.medicineStockId;
    expect(stock2Id).not.toBe(stock1Id);
  });

  it('GET /api/medicines → list all stock', async () => {
    const res = await request(app)
      .get('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(Array.isArray(res.body.medicines)).toBe(true);
    expect(res.body.medicines.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/medicines?q=Med filters by name', async () => {
    const res = await request(app)
      .get(`/api/medicines?q=${masterMedName1}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body.medicines.length).toBeGreaterThanOrEqual(1);
    expect(res.body.medicines[0].medicine.name).toBe(masterMedName1);
  });

  it('PUT /api/medicines/:id updates stock price', async () => {
    const res = await request(app)
      .put(`/api/medicines/${stock1Id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: '13.00' })
      .expect(200);
    expect(res.body.price).toBe('13.00');
  });

  it('DELETE /api/medicines/:id removes stock entry', async () => {
    await request(app)
      .delete(`/api/medicines/${stock2Id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);
    const list = await request(app)
      .get('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(
      list.body.medicines.find((s: any) => s.medicineStockId === stock2Id),
    ).toBeUndefined();
  });
});

// Add tests for:
// - Creating a master medicine
// - Creating a medicine stock referencing a master medicine
// - Creating a customer
// - Creating a bill with credit flag and customer reference
// - Ensuring only name is required for patient
