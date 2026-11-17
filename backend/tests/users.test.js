const { sequelize } = require('../models');
const { createApp, request, resetDB, newUser, loggedInAgent, adminAgent } = require('./helpers');

let app;
beforeAll(() => {
  app = createApp();
});
beforeEach(resetDB);
afterAll(() => sequelize.close());

describe('GET /api/users/keepers', () => {
  test('guests see keepers without contact details or address', async () => {
    await loggedInAgent(app, { type: 'PETKEEPER' });

    const res = await request(app).get('/api/users/keepers').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('firstName');
    for (const hidden of ['email', 'phoneNumber', 'address', 'birthdate', 'passwordHash']) {
      expect(res.body[0]).not.toHaveProperty(hidden);
    }
  });

  test('logged-in users also see email and phone, but not address', async () => {
    await loggedInAgent(app, { type: 'PETKEEPER' });
    const { agent } = await loggedInAgent(app, { type: 'PETOWNER' });

    const res = await agent.get('/api/users/keepers').expect(200);
    expect(res.body[0]).toHaveProperty('email');
    expect(res.body[0]).toHaveProperty('phoneNumber');
    expect(res.body[0]).not.toHaveProperty('address');
  });
});

describe('GET /api/users/owners', () => {
  test('guests get 401', async () => {
    await request(app).get('/api/users/owners').expect(401);
  });

  test('owners get 403', async () => {
    const { agent } = await loggedInAgent(app, { type: 'PETOWNER' });
    await agent.get('/api/users/owners').expect(403);
  });

  test('keepers can list owners', async () => {
    await loggedInAgent(app, { type: 'PETOWNER' });
    const { agent } = await loggedInAgent(app, { type: 'PETKEEPER' });
    const res = await agent.get('/api/users/owners').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('PETOWNER');
  });
});

describe('PATCH /api/users/me', () => {
  test('guests get 401', async () => {
    await request(app).patch('/api/users/me').send({ city: 'Athens' }).expect(401);
  });

  test('updates the logged-in user only', async () => {
    const other = await loggedInAgent(app);
    const { agent, user } = await loggedInAgent(app);

    const res = await agent.patch('/api/users/me').send({ city: 'Heraklion' }).expect(200);
    expect(res.body.userName).toBe(user.userName);
    expect(res.body.city).toBe('Heraklion');

    const otherProfile = await other.agent.get('/api/auth/me').expect(200);
    expect(otherProfile.body.city).toBe('Thessaloniki');
  });

  test.each([['type'], ['userName'], ['email'], ['passwordHash']])(
    'cannot change %s',
    async (field) => {
      const { agent } = await loggedInAgent(app);
      await agent.patch('/api/users/me').send({ [field]: 'PETKEEPER' }).expect(400);
    }
  );

  test('changing the password requires the current password', async () => {
    const { agent, user } = await loggedInAgent(app);

    await agent.patch('/api/users/me').send({ password: 'new-password-1' }).expect(400);
    await agent
      .patch('/api/users/me')
      .send({ password: 'new-password-1', currentPassword: 'wrong-one' })
      .expect(403);
    await agent
      .patch('/api/users/me')
      .send({ password: 'new-password-1', currentPassword: user.password })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ username: user.userName, password: user.password })
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ username: user.userName, password: 'new-password-1' })
      .expect(200);
  });
});

describe('admin routes', () => {
  test('guests get 401 and regular users get 403', async () => {
    await request(app).get('/api/admin/users').expect(401);
    await request(app).delete('/api/admin/users/anyone').expect(401);

    const { agent, user } = await loggedInAgent(app);
    await agent.get('/api/admin/users').expect(403);
    await agent.delete(`/api/admin/users/${user.userName}`).expect(403);
  });

  test('admins can list and delete users', async () => {
    const { user } = await loggedInAgent(app);
    const admin = await adminAgent(app);

    const list = await admin.get('/api/admin/users').expect(200);
    expect(list.body.map((u) => u.userName)).toContain(user.userName);
    expect(list.body[0]).not.toHaveProperty('passwordHash');

    await admin.delete(`/api/admin/users/${user.userName}`).expect(204);
    await admin.delete(`/api/admin/users/${user.userName}`).expect(404);
  });

  test('a deleted user loses access', async () => {
    const { agent, user } = await loggedInAgent(app);
    const admin = await adminAgent(app);
    await admin.delete(`/api/admin/users/${user.userName}`).expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  test('admin is reported as ADMIN by /me', async () => {
    const admin = await adminAgent(app);
    const res = await admin.get('/api/auth/me').expect(200);
    expect(res.body).toEqual({ userName: 'site_admin', role: 'ADMIN' });
  });

  test('nobody can register with an admin username', async () => {
    await adminAgent(app);
    await request(app)
      .post('/api/auth/register')
      .send(newUser({ userName: 'site_admin' }))
      .expect(409);
  });
});

describe('error handling', () => {
  test('malformed JSON gets a 400, not a stack trace', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username":')
      .expect(400);
    expect(res.body).toEqual({ error: 'Malformed JSON body' });
  });

  test('unknown routes get a JSON 404', async () => {
    await request(app).get('/api/nope').expect(404);
  });
});
