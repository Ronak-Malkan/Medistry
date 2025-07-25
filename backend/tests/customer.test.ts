// @ts-nocheck
import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';

interface AuthResponse {
  token: string;
}

let userToken: string; // app_admin token
let customerId: number;

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
  const adminToken = reg.body.token;

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
  userToken = login.body.token;
}, 20000);

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Customer CRUD Endpoints', () => {
  it('GET /api/customers → empty list', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.customers).toEqual([]);
  });

  it('POST /api/customers → create new customer with all fields', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '+1234567890',
      address: '123 Main St, City, State 12345',
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send(customerData);
    expect(res.status).toBe(201);
    expect(res.body.customerId).toBeGreaterThan(0);
    expect(res.body.name).toBe(customerData.name);
    expect(res.body.phone).toBe(customerData.phone);
    expect(res.body.address).toBe(customerData.address);
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
    customerId = res.body.customerId;
  });

  it('POST /api/customers → create customer with only name', async () => {
    const customerData = {
      name: 'Jane Smith',
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send(customerData);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(customerData.name);
    expect(res.body.phone).toBeNull();
    expect(res.body.address).toBeNull();
  });

  it('POST /api/customers → fail without name', async () => {
    const customerData = {
      phone: '+1234567890',
      address: '123 Main St',
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send(customerData);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/customers → list with new entries', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.customers).toHaveLength(2);
    const names = res.body.customers.map((c: any) => c.name);
    expect(names).toEqual(expect.arrayContaining(['John Doe', 'Jane Smith']));
  });

  it('GET /api/customers/:customerId → get customer by ID', async () => {
    if (!customerId) throw new Error('customerId not set from previous test');
    const res = await request(app)
      .get(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.customerId).toBe(customerId);
    expect(res.body.name).toBe('John Doe');
  });

  it('PUT /api/customers/:customerId → update customer', async () => {
    if (!customerId) throw new Error('customerId not set from previous test');
    const updateData = {
      name: 'John Doe Updated',
      phone: '+1987654321',
      address: '456 Oak Ave, New City, State 54321',
    };

    const res = await request(app)
      .put(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(updateData.name);
    expect(res.body.phone).toBe(updateData.phone);
    expect(res.body.address).toBe(updateData.address);
  });

  it('GET /api/customers?q=john filters results', async () => {
    const res = await request(app)
      .get('/api/customers?q=john')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.customers).toHaveLength(1);
    expect(res.body.customers[0].name.toLowerCase()).toContain('john');
  });

  it('DELETE /api/customers/:customerId → 204', async () => {
    if (!customerId) throw new Error('customerId not set from previous test');
    const res = await request(app)
      .delete(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(204);
  });

  it('GET /api/customers → list after deletion', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.customers).toHaveLength(1); // Only Jane Smith remains
    expect(res.body.customers[0].name).toBe('Jane Smith');
  });
});

describe('Customer Smart Search Endpoints', () => {
  beforeAll(async () => {
    // Add multiple customers for search tests
    const customers = [
      { name: 'Johnson Alice', phone: '+1111111111' },
      { name: 'Johnson Bob', phone: '+2222222222' },
      { name: 'Smith Charlie', phone: '+3333333333' },
      { name: 'Wilson David', phone: '+4444444444' },
      { name: 'Brown Eve', phone: '+5555555555' },
      { name: 'Davis Frank', phone: '+6666666666' },
      { name: 'Miller Grace', phone: '+7777777777' },
      { name: 'Garcia Henry', phone: '+8888888888' },
      { name: 'Rodriguez Ivy', phone: '+9999999999' },
      { name: 'Martinez Jack', phone: '+1010101010' },
      { name: 'Anderson Kate', phone: '+1111111112' },
      { name: 'Taylor Liam', phone: '+1212121212' },
    ];
    for (const customer of customers) {
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .send(customer);
    }
  });

  it('GET /api/customers/search?q=johnson returns matching customers (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/customers/search?q=johnson')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const names = res.body.map((c: any) => c.name.toLowerCase());
    expect(names).toEqual(
      expect.arrayContaining(['johnson alice', 'johnson bob']),
    );
  });

  it('GET /api/customers/search?q=johnson limits results to 10', async () => {
    const res = await request(app)
      .get('/api/customers/search?q=johnson')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(10);
  });

  it('GET /api/customers/search?q=nonexistent returns empty array', async () => {
    const res = await request(app)
      .get('/api/customers/search?q=nonexistent')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/customers/searchall?q=johnson returns all matching customers', async () => {
    const res = await request(app)
      .get('/api/customers/searchall?q=johnson')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const names = res.body.map((c: any) => c.name.toLowerCase());
    expect(names).toEqual(
      expect.arrayContaining(['johnson alice', 'johnson bob']),
    );
    expect(names.every((n: string) => n.startsWith('johnson'))).toBe(true);
  });

  it('GET /api/customers/searchall?q= returns all customers (no query)', async () => {
    const res = await request(app)
      .get('/api/customers/searchall?q=')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(10);
  });

  it('GET /api/customers/search without app_admin role returns 403', async () => {
    // Login as account_admin (not app_admin)
    const login = await request(app)
      .post('/auth/login')
      .send({
        username: companyPayload.admin.username,
        password: companyPayload.admin.password,
        loginAs: 'user',
      })
      .expect(200);
    const adminToken = login.body.token;

    const res = await request(app)
      .get('/api/customers/search?q=johnson')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([401, 403]).toContain(res.status);
  });
});

describe('Customer Edge Cases and Error Handling', () => {
  it('should handle very long customer names', async () => {
    const longName = 'A'.repeat(255); // Test with maximum reasonable length
    const customerData = {
      name: longName,
      phone: '+1234567890',
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send(customerData);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(longName);
  });

  it('should handle special characters in customer names', async () => {
    const customerData = {
      name: 'Customer with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
      phone: '+1234567890',
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send(customerData);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(customerData.name);
  });

  it('should handle unicode characters in customer names', async () => {
    const customerData = {
      name: 'José María García-López',
      phone: '+1234567890',
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send(customerData);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(customerData.name);
  });

  it('should handle search with special characters', async () => {
    // Create customer with special characters
    await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Special & Characters Customer' });

    const res = await request(app)
      .get('/api/customers/search?q=Special')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should return 404 for non-existent customer', async () => {
    const res = await request(app)
      .get('/api/customers/99999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 400 for non-existent customer update', async () => {
    const res = await request(app)
      .put('/api/customers/99999')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Non-existent Customer' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 400 for non-existent customer delete', async () => {
    const res = await request(app)
      .delete('/api/customers/99999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should fail without authentication', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
  });
});
