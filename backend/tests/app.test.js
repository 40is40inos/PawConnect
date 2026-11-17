const fs = require('fs');
const os = require('os');
const path = require('path');
const { sequelize } = require('../models');
const { createApp, request, resetDB } = require('./helpers');

beforeAll(resetDB);
afterAll(() => sequelize.close());

describe('health check', () => {
  test('reports the app and database as ok', async () => {
    const res = await request(createApp()).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
  });
});

describe('serving the built frontend (FRONTEND_DIR)', () => {
  let app;
  let dir;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'paw-frontend-'));
    fs.mkdirSync(path.join(dir, 'static'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>PawConnect</title>');
    fs.writeFileSync(path.join(dir, 'static', 'main.abc123.js'), 'console.log(1)');
    process.env.FRONTEND_DIR = dir;
    app = createApp();
    delete process.env.FRONTEND_DIR;
  });

  test('serves the app shell at / and on client-side routes', async () => {
    for (const url of ['/', '/login', '/keepers/eleni_k']) {
      const res = await request(app).get(url).expect(200);
      expect(res.text).toContain('<title>PawConnect</title>');
      expect(res.headers['cache-control']).toBe('no-cache');
    }
  });

  test('caches hashed static files for a year', async () => {
    const res = await request(app).get('/static/main.abc123.js').expect(200);
    expect(res.headers['cache-control']).toMatch(/max-age=31536000/);
  });

  test('unknown API routes still get a JSON 404', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  test('refuses to start when the build is missing', () => {
    process.env.FRONTEND_DIR = path.join(dir, 'missing');
    expect(() => createApp()).toThrow(/Build the frontend first/);
    delete process.env.FRONTEND_DIR;
  });
});

describe('HTTPS settings', () => {
  afterEach(() => {
    delete process.env.COOKIE_SECURE;
  });

  test('COOKIE_SECURE=true marks the session cookie Secure and upgrades requests', async () => {
    process.env.COOKIE_SECURE = 'true';
    const res = await request(createApp()).post('/api/auth/logout');
    expect(res.headers['set-cookie'][0]).toMatch(/Secure/);
    expect(res.headers['content-security-policy']).toMatch(/upgrade-insecure-requests/);
  });

  test('plain HTTP keeps cookies usable and does not upgrade requests', async () => {
    process.env.COOKIE_SECURE = 'false';
    const res = await request(createApp()).post('/api/auth/logout');
    expect(res.headers['set-cookie'][0]).not.toMatch(/Secure/);
    expect(res.headers['content-security-policy']).not.toMatch(/upgrade-insecure-requests/);
  });
});
