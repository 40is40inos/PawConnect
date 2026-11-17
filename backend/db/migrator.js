// Versioned schema migrations with Umzug (the library behind sequelize-cli).
// Applied migrations are recorded in the SequelizeMeta table, so each one
// runs exactly once per database.
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('../utils/db_connection');

const migrator = new Umzug({
  migrations: { glob: ['migrations/*.js', { cwd: __dirname }] },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger:
    process.env.NODE_ENV === 'test'
      ? undefined
      : {
          info: ({ event, name }) => console.log(`[migrations] ${event} ${name ?? ''}`.trim()),
          warn: console.warn,
          error: console.error,
          debug: () => {},
        },
});

// Brings the database up to the latest schema.
const migrate = () => migrator.up();

module.exports = { migrator, migrate, migrationsDir: path.join(__dirname, 'migrations') };
