const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');
const { createApp, request, resetDB, newUser, loggedInAgent } = require('./helpers');

let app;
beforeAll(() => {
  app = createApp();
});
beforeEach(resetDB);
afterAll(() => sequelize.close());

const sessionCookie = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('session='));

describe('POST /api/auth/register', () => {
  test('stores a bcrypt hash, never the plain password', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user).expect(201);

    const row = await User.scope('withPassword').findByPk(user.userName);
    expect(row.passwordHash).not.toBe(user.password);
    expect(await bcrypt.compare(user.password, row.passwordHash)).toBe(true);
  });

  test('response and cookie contain no password or hash', async () => {
    const user = newUser();
    const res = await request(app).post('/api/auth/register').send(user).expect(201);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body.role).toBe('PETOWNER');

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(decodeURIComponent(cookie)).not.toContain(user.password);
  });

  test('rejects a duplicate username or email with 409', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user).expect(201);

    const sameName = await request(app)
      .post('/api/auth/register')
      .send({ ...newUser(), userName: user.userName })
      .expect(409);
    expect(sameName.body.error).toBe('Username already exists');

    const sameEmail = await request(app)
      .post('/api/auth/register')
      .send({ ...newUser(), email: user.email.toUpperCase() })
      .expect(409);
    expect(sameEmail.body.error).toBe('Email already exists');
  });

  test.each([
    ['short password', { password: 'short' }, 'password'],
    ['bad email', { email: 'not-an-email' }, 'email'],
    ['phone with letters', { phoneNumber: '69abc' }, 'phoneNumber'],
    ['future birthdate', { birthdate: '2999-01-01' }, 'birthdate'],
    ['admin as account type', { type: 'ADMIN' }, 'type'],
  ])('rejects %s with 400', async (_label, override, field) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser(override))
      .expect(400);
    expect(res.body.details.map((d) => d.field)).toContain(field);
  });

  test('rejects unknown fields such as passwordHash', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ ...newUser(), passwordHash: 'x' })
      .expect(400);
  });
});

describe('POST /api/auth/login', () => {
  test('logs in with correct credentials', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: user.userName, password: user.password })
      .expect(200);
    expect(res.body.userName).toBe(user.userName);
    expect(sessionCookie(res)).toBeDefined();
  });

  test('gives the same 401 for a wrong password and an unknown user', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ username: user.userName, password: 'wrong-password' })
      .expect(401);
    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'wrong-password' })
      .expect(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
  });

  test('there is no default admin/admin account', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' })
      .expect(401);
  });

  test('is rate limited per IP', async () => {
    process.env.LOGIN_RATE_LIMIT = '3';
    const limitedApp = createApp();
    process.env.LOGIN_RATE_LIMIT = '1000';

    for (let i = 0; i < 3; i += 1) {
      await request(limitedApp)
        .post('/api/auth/login')
        .send({ username: 'nobody', password: 'guess' })
        .expect(401);
    }
    await request(limitedApp)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'guess' })
      .expect(429);
  });
});

describe('session', () => {
  test('GET /api/auth/me needs a session', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  test('GET /api/auth/me returns the logged-in profile', async () => {
    const { agent, user } = await loggedInAgent(app);
    const res = await agent.get('/api/auth/me').expect(200);
    expect(res.body.userName).toBe(user.userName);
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  test('a forged cookie claiming ADMIN is rejected', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'session=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiJ4In0.forged')
      .expect(401);
  });

  test('logout ends the session', async () => {
    const { agent } = await loggedInAgent(app);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
});
