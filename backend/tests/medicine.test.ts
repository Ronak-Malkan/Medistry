// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';

interface AuthResponse {
  token: string;
}

let adminToken: string, userToken: string;
let med1Id: number, med2Id: number;
let testContentId: number;

// Company registration payload matches your other tests:
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

const baseDto1 = {
  name: 'Med A',
  contentId: 0,
  batchNumber: 'BN1',
  incomingDate: '2025-01-01',
  expiryDate: '2025-12-31',
  quantityAvailable: 10,
  price: '12.50',
};
const baseDto1b = { ...baseDto1, quantityAvailable: 5 }; // same batch→merge to 15

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
  it('POST new medicine and then merge same batch', async () => {
    // Create first batch using the valid contentId
    const dtoA1 = {
      ...baseDto1,
      contentId: testContentId,
    };
    const r1 = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .send(dtoA1)
      .expect(201);
    med1Id = r1.body.medicineId;
    expect(r1.body.quantityAvailable).toBe(10);

    // Create same batch again → same ID, quantity = 15
    const dtoA2 = { ...baseDto1b, contentId: testContentId };
    const r2 = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .send(dtoA2)
      .expect(201);
    expect(r2.body.medicineId).toBe(med1Id);
    expect(r2.body.quantityAvailable).toBe(15);
  });

  it('POST a different batch', async () => {
    const dto2 = {
      name: 'Med A',
      contentId: testContentId,
      batchNumber: 'BN2',
      incomingDate: '2025-01-01',
      expiryDate: '2025-12-31',
      unitsPerPack: undefined,
      quantityAvailable: 7,
      price: '12.50',
    };
    const r = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .send(dto2)
      .expect(201);
    med2Id = r.body.medicineId;
    expect(med2Id).not.toBe(med1Id);
  });

  it('GET /api/medicines → list all', async () => {
    const res = await request(app)
      .get('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body.medicines).toHaveLength(2);
  });

  it('GET /api/medicines?q=Med filters by name', async () => {
    const res = await request(app)
      .get('/api/medicines?q=Med')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body.medicines.length).toBe(2);
  });

  it('PUT /api/medicines/:id updates price', async () => {
    const res = await request(app)
      .put(`/api/medicines/${med1Id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: '13.00' })
      .expect(200);
    expect(res.body.price).toBe('13.00');
  });

  it('DELETE /api/medicines/:id removes entry', async () => {
    await request(app)
      .delete(`/api/medicines/${med2Id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);
    const list = await request(app)
      .get('/api/medicines')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(
      list.body.medicines.find((m: any) => m.medicineId === med2Id),
    ).toBeUndefined();
  });
});
