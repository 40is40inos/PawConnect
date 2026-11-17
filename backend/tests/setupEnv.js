// Runs before each test file: an isolated in-memory SQLite database per file.
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test-secret-not-for-production';
process.env.BCRYPT_ROUNDS = '4'; // fast hashing in tests only
process.env.LOGIN_RATE_LIMIT = '1000';
