const { Sequelize } = require('sequelize');

// Picks the database from the environment:
// - DATABASE_URL: mysql://... or postgres://... (used in production and Docker)
// - DB_DIALECT=sqlite: a file or in-memory database (tests, quick local runs)
// - otherwise MySQL from DB_HOST / DB_NAME / DB_USER / DB_PASS
function createSequelize() {
  const common = { logging: false };
  const url = process.env.DATABASE_URL;

  if (url) {
    // Hosted databases (Neon, Aiven, ...) require TLS.
    const ssl = process.env.DB_SSL === 'true' || /sslmode=(require|verify)/.test(url);
    return new Sequelize(url, {
      ...common,
      dialectOptions: ssl ? { ssl: { require: true, rejectUnauthorized: true } } : {},
    });
  }

  if (process.env.DB_DIALECT === 'sqlite') {
    return new Sequelize({
      ...common,
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || ':memory:',
    });
  }

  return new Sequelize(
    process.env.DB_NAME || 'pet_marketplace',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      ...common,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
    }
  );
}

const sequelize = createSequelize();

module.exports = { sequelize };
