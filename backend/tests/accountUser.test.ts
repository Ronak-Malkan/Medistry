import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';

interface AuthResponse {
  token: string;
}

let jwtToken: string;
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

  const res = await request(app)
    .post('/auth/company/register')
    .send(companyPayload)
    .set('Accept', 'application/json');
  jwtToken = (res.body as AuthResponse).token;
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

  it('GET /api/users returns initial admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].username).toBe(companyPayload.admin.username);
  });

  it('POST /api/users creates new user', async () => {
    const newUser = {
      username: 'bob',
      password: 'BobPass123!',
      fullName: 'Bob Builder',
      email: 'bob@test.co',
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
    const res = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ fullName: 'Bobby Builder' });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Bobby Builder');
  });

  it('DELETE /api/users/:id deletes user', async () => {
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
