// Runs before each test file.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-not-for-production';
process.env.BCRYPT_ROUNDS = '4'; // fast hashing in tests only
process.env.LOGIN_RATE_LIMIT = '1000';

if (process.env.TEST_DATABASE_URL) {
  // A real MySQL or Postgres server (CI runs the suite on both).
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  delete process.env.DB_DIALECT;
} else {
  // An isolated in-memory SQLite database per test file.
  delete process.env.DATABASE_URL;
  process.env.DB_DIALECT = 'sqlite';
  process.env.DB_STORAGE = ':memory:';
}
