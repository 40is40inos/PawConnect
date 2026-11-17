// Starts PawConnect for local browser tests: production mode, a fresh SQLite
// database with demo data, and the built frontend from ../frontend/build.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const backend = path.join(__dirname, '..', 'backend');
const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
const dbFile = path.join(os.tmpdir(), 'pawconnect-e2e.sqlite');

if (!fs.existsSync(path.join(frontendBuild, 'index.html'))) {
  console.error('Build the frontend first: cd frontend && npm run build');
  process.exit(1);
}
fs.rmSync(dbFile, { force: true });

const env = {
  ...process.env,
  NODE_ENV: 'production',
  COOKIE_SECURE: 'false', // plain http://localhost
  DB_DIALECT: 'sqlite',
  DB_STORAGE: dbFile,
  JWT_SECRET: 'e2e-secret',
  BCRYPT_ROUNDS: '4',
  LOGIN_RATE_LIMIT: '1000',
  FRONTEND_DIR: frontendBuild,
  PORT: '5100',
  DEMO_ADMIN_PASSWORD: 'demo-password',
};

execFileSync(process.execPath, ['scripts/seedDemo.js'], { cwd: backend, env, stdio: 'inherit' });
const server = spawn(process.execPath, ['server.js'], { cwd: backend, env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code ?? 0));
