// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';

interface JWTBody {
  userId: number;
  accountId: number;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Simple JWT payload parser for tests.
 * Splits on dots, base64-decodes the payload segment, and parses JSON.
 */
function parseJwt<T>(token: string): T {
  const [, payload] = token.split('.');
  const json = Buffer.from(payload, 'base64').toString('utf8');
  return JSON.parse(json) as T;
}

beforeAll(async () => {
  await AppDataSource.initialize();
  // drop existing tables and re-sync schema
  await AppDataSource.synchronize(true);
}, 20000);

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Auth Endpoints Integration', () => {
  const adminCredentials = {
    username: 'adminuser',
    password: 'securepassword',
    fullName: 'Admin User',
    email: 'admin@email.com',
  };

  const companyPayload = {
    company: {
      name: 'Test Pharmacy',
      drugLicenseNumber: 'DL123456',
      address: '123 Main St',
      contactEmail: 'pharmacy@email.com',
      contactPhone: '1234567890',
      lowStockThreshold: 5,
      expiryAlertLeadTime: 30,
    },
    admin: adminCredentials,
  };

  let jwtToken: string;

  it('POST /auth/company/register → should return 201 and a JWT', async () => {
    const res = await request(app)
      .post('/auth/company/register')
      .send(companyPayload);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    jwtToken = res.body.token;
    const decoded = parseJwt<JWTBody>(res.body.token);
    expect(decoded.role).toBe('account_admin');
    expect(decoded.userId).toBeGreaterThan(0);
    expect(decoded.accountId).toBeGreaterThan(0);
  });

  it('POST /auth/login → loginAs company_admin succeeds', async () => {
    const res = await request(app).post('/auth/login').send({
      username: adminCredentials.username,
      password: adminCredentials.password,
      loginAs: 'company',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    const decoded = parseJwt<JWTBody>(res.body.token);
    expect(decoded.role).toBe('account_admin');
  });

  it('POST /auth/login → wrong loginAs "user" is forbidden', async () => {
    const res = await request(app).post('/auth/login').send({
      username: adminCredentials.username,
      password: adminCredentials.password,
      loginAs: 'user',
    });
    expect(res.status).toBe(401);
  });

  it('POST /auth/login → wrong password is rejected', async () => {
    const res = await request(app).post('/auth/login').send({
      username: adminCredentials.username,
      password: 'BadPassword!',
      loginAs: 'company',
    });
    expect(res.status).toBe(401);
  });
});
