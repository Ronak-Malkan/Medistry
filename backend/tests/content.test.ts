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
  if (process.env.NODE_ENV === 'test') {
    await AppDataSource.synchronize(true); // Reset test DB between runs
  }

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

describe('Content Smart Search Endpoints', () => {
  beforeAll(async () => {
    // Add multiple contents for search tests
    const names = [
      'Paracetamol',
      'Pantoprazole',
      'Amoxicillin',
      'Amlodipine',
      'Cetirizine',
      'Cefixime',
      'Azithromycin',
      'Atorvastatin',
      'Metformin',
      'Metronidazole',
      'Ibuprofen',
      'Ivermectin',
      'Doxycycline',
      'Diclofenac',
      'Domperidone',
      'Dexamethasone',
      'Clopidogrel',
      'Ciprofloxacin',
    ];
    for (const name of names) {
      await request(app)
        .post('/api/contents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name });
    }
  });

  it('GET /api/contents/search?prefix=Pa returns top 15 prefix matches', async () => {
    const res = await request(app)
      .get('/api/contents/search?prefix=Pa')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(15);
    expect(res.body.some((c: any) => c.name.startsWith('Pa'))).toBe(true);
  });

  it('GET /api/contents/search?prefix=Me returns Metformin and Metronidazole', async () => {
    const res = await request(app)
      .get('/api/contents/search?prefix=Me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    const names = res.body.map((c: any) => c.name);
    expect(names).toEqual(
      expect.arrayContaining(['Metformin', 'Metronidazole']),
    );
  });

  it('GET /api/contents/search?prefix=Zzzz returns empty array', async () => {
    const res = await request(app)
      .get('/api/contents/search?prefix=Zzzz')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/contents/searchall?prefix=Am returns all Am* matches', async () => {
    const res = await request(app)
      .get('/api/contents/searchall?prefix=Am')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    const names = res.body.map((c: any) => c.name);
    expect(names).toEqual(
      expect.arrayContaining(['Amoxicillin', 'Amlodipine']),
    );
    expect(names.every((n: string) => n.startsWith('Am'))).toBe(true);
  });

  it('GET /api/contents/searchall?prefix= returns all contents (no prefix)', async () => {
    const res = await request(app)
      .get('/api/contents/searchall?prefix=')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(10);
  });

  it('GET /api/contents/search without app_admin role returns 403', async () => {
    const res = await request(app)
      .get('/api/contents/search?prefix=Pa')
      .set('Authorization', `Bearer ${adminToken}`); // not app_admin
    expect([401, 403]).toContain(res.status);
  });
});
