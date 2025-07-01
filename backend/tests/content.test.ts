// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';

interface AuthResponse {
  token: string;
}

let adminToken: string; // account_admin token
let userToken: string; // app_admin token
let createdId: number;

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
  username: 'bob',
  password: 'BobPass123!',
  fullName: 'Bob Builder',
  email: 'bob@test.co',
  role: 'app_admin' as const,
};

beforeAll(async () => {
  await AppDataSource.initialize();
  await AppDataSource.synchronize(true);

  // 1) Register company → returns account_admin token
  const reg = await request(app)
    .post('/auth/company/register')
    .send(companyPayload)
    .set('Accept', 'application/json');
  adminToken = (reg.body as AuthResponse).token;

  // 2) Create an app_admin user under this account
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(appAdmin)
    .expect(201);

  // 3) Login as that app_admin user
  const login = await request(app)
    .post('/auth/login')
    .send({
      username: appAdmin.username,
      password: appAdmin.password,
      loginAs: 'user',
    })
    .expect(200);
  userToken = (login.body as AuthResponse).token;
}, 20000);

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Content CRUD Endpoints', () => {
  it('GET /api/contents → empty list', async () => {
    const res = await request(app)
      .get('/api/contents')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.contents).toEqual([]);
  });

  it('POST /api/contents → create new', async () => {
    const res = await request(app)
      .post('/api/contents')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Paracetamol' });
    expect(res.status).toBe(201);
    expect(res.body.contentId).toBeGreaterThan(0);
    expect(res.body.name).toBe('Paracetamol');
    createdId = res.body.contentId;
  });

  it('GET /api/contents → list with new entry', async () => {
    const res = await request(app)
      .get('/api/contents')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.contents).toHaveLength(1);
    expect(res.body.contents[0].name).toBe('Paracetamol');
  });

  it('PUT /api/contents/:id → rename', async () => {
    const res = await request(app)
      .put(`/api/contents/${createdId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Acetaminophen' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acetaminophen');
  });

  it('GET /api/contents?q=acet filters results', async () => {
    const res = await request(app)
      .get('/api/contents?q=acet')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.contents).toHaveLength(1);
    expect(res.body.contents[0].name.toLowerCase()).toContain('acet');
  });

  it('DELETE /api/contents/:id → 204', async () => {
    const res = await request(app)
      .delete(`/api/contents/${createdId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(204);
  });

  it('GET /api/contents → empty again', async () => {
    const res = await request(app)
      .get('/api/contents')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.contents).toEqual([]);
  });
});
