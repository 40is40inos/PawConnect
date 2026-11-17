// Tests use an in-memory SQLite database per test file by default.
// Set TEST_DATABASE_URL (mysql://... or postgres://...) to run the same
// tests against a real server; files then run one at a time because they
// share that database.
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  maxWorkers: process.env.TEST_DATABASE_URL ? 1 : '50%',
};
