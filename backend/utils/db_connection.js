const { Sequelize } = require('sequelize');

// MySQL in development/production. SQLite (in memory by default) is used by the
// test suite so it can run in CI without a database server.
function createSequelize() {
  if (process.env.DB_DIALECT === 'sqlite') {
    return new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || ':memory:',
      logging: false,
    });
  }

  return new Sequelize(
    process.env.DB_NAME || 'pet_marketplace',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: false,
    }
  );
}

const sequelize = createSequelize();

module.exports = { sequelize };
