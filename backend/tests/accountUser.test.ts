// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';

interface AuthResponse {
  token: string;
}

let jwtToken: string; // account_admin
let appAdminToken: string; // app_admin
let createdUserId: number;

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

beforeAll(async () => {
  await AppDataSource.initialize();
  await AppDataSource.synchronize(true);

  // Register company (creates account_admin)
  const res = await request(app)
    .post('/auth/company/register')
    .send(companyPayload)
    .set('Accept', 'application/json');
  jwtToken = (res.body as AuthResponse).token;

  // Create app_admin user
  const newUser = {
    username: 'bob',
    password: 'BobPass123!',
    fullName: 'Bob Builder',
    email: 'bob@test.co',
    role: 'app_admin',
  };
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${jwtToken}`)
    .send(newUser)
    .expect(201);

  // Login as app_admin
  const login = await request(app)
    .post('/auth/login')
    .send({
      username: newUser.username,
      password: newUser.password,
      loginAs: 'user',
    })
    .expect(200);
  appAdminToken = (login.body as AuthResponse).token;
}, 20000);

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Account & User Management', () => {
  it('GET /api/accounts returns correct data', async () => {
    const res = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(companyPayload.company.name);
    expect(res.body.drugLicenseNumber).toBe(
      companyPayload.company.drugLicenseNumber,
    );
  });

  it('PUT /api/accounts updates settings', async () => {
    const newName = 'NewNameCo';
    const res = await request(app)
      .put('/api/accounts')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ name: newName });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(newName);
  });

  it('GET /api/users returns initial admin and app_admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    const usernames = res.body.users.map((u: any) => u.username);
    expect(usernames).toEqual(
      expect.arrayContaining([companyPayload.admin.username, 'bob']),
    );
  });

  it('POST /api/users creates new user', async () => {
    const newUser = {
      username: 'bob2',
      password: 'BobPass123!',
      fullName: 'Bob Two',
      email: 'bob2@test.co',
      role: 'app_admin',
    };
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.userId).toBeGreaterThan(1);
    expect(res.body.username).toBe(newUser.username);
    createdUserId = res.body.userId;
  });

  it('PUT /api/users/:id updates user', async () => {
    if (!createdUserId) return;
    const res = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ fullName: 'Bobby Two' });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Bobby Two');
  });

  it('DELETE /api/users/:id deletes user', async () => {
    if (!createdUserId) return;
    const del = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(del.status).toBe(204);

    // confirm deletion
    const list = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(
      list.body.users.find((u: any) => u.userId === createdUserId),
    ).toBeUndefined();
  });
});

describe('Patient & Provider Edge/Error Cases', () => {
  let patientId: number;
  let providerId: number;

  it('POST /api/patients should fail with missing name', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${appAdminToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toBeDefined();
  });

  it('POST /api/patients should create and GET/PUT/DELETE patient', async () => {
    // Create
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${appAdminToken}`)
      .send({ name: 'EdgeCase Patient' });
    expect(res.status).toBe(201);
    patientId = res.body.patient_id || res.body.patientId;
    // Get
    const getRes = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect(getRes.status).toBe(200);
    // Update
    const putRes = await request(app)
      .put(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${appAdminToken}`)
      .send({ name: 'Updated Patient' });
    expect(putRes.status).toBe(200);
    // Delete
    const delRes = await request(app)
      .delete(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect([204, 200]).toContain(delRes.status);
    // Get after delete
    const getAfterDel = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect(getAfterDel.status).toBe(404);
  });

  it('PUT/DELETE /api/patients/:id should 404 for non-existent', async () => {
    const res1 = await request(app)
      .put('/api/patients/99999')
      .set('Authorization', `Bearer ${appAdminToken}`)
      .send({ name: 'Nope' });
    expect(res1.status).toBe(404);
    const res2 = await request(app)
      .delete('/api/patients/99999')
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect(res2.status).toBe(404);
  });

  it('POST /api/providers should fail with missing name', async () => {
    const res = await request(app)
      .post('/api/providers')
      .set('Authorization', `Bearer ${appAdminToken}`)
      .send({ contactEmail: 'a@b.com', contactPhone: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toBeDefined();
  });

  it('POST /api/providers should create and GET/PUT/DELETE provider', async () => {
    // Create
    const res = await request(app)
      .post('/api/providers')
      .set('Authorization', `Bearer ${appAdminToken}`)
      .send({
        name: 'EdgeCase Provider',
        contactEmail: 'a@b.com',
        contactPhone: '123',
      });
    expect(res.status).toBe(201);
    providerId = res.body.providerId || res.body.provider_id;
    // Get (list)
    const getRes = await request(app)
      .get('/api/providers')
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect(getRes.status).toBe(200);
    // Update
    const putRes = await request(app)
      .put(`/api/providers/${providerId}`)
      .set('Authorization', `Bearer ${appAdminToken}`)
      .send({ name: 'Updated Provider' });
    expect(putRes.status).toBe(200);
    // Delete
    const delRes = await request(app)
      .delete(`/api/providers/${providerId}`)
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect([204, 200]).toContain(delRes.status);
  });

  it('PUT/DELETE /api/providers/:id should 400 for non-existent', async () => {
    const res1 = await request(app)
      .put('/api/providers/99999')
      .set('Authorization', `Bearer ${appAdminToken}`)
      .send({ name: 'Nope' });
    expect(res1.status).toBe(400);
    const res2 = await request(app)
      .delete('/api/providers/99999')
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect(res2.status).toBe(400);
  });

  it('GET /api/patients/search returns empty for no match', async () => {
    const res = await request(app)
      .get('/api/patients/search?q=nonexistent')
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('GET /api/providers/search returns empty for no match', async () => {
    const res = await request(app)
      .get('/api/providers/search?q=nonexistent')
      .set('Authorization', `Bearer ${appAdminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
