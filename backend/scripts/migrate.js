// npm run migrate          apply all pending migrations
// npm run migrate:undo     undo the most recent migration
// npm run migrate:status   list applied and pending migrations
require('dotenv').config();

const { migrator } = require('../db/migrator');
const { sequelize } = require('../utils/db_connection');

async function main() {
  const command = process.argv[2] || 'up';
  if (command === 'up') {
    const done = await migrator.up();
    console.log(done.length ? `Applied ${done.length} migration(s).` : 'Database is up to date.');
  } else if (command === 'down') {
    const undone = await migrator.down();
    console.log(undone.length ? `Undid ${undone[0].name}.` : 'Nothing to undo.');
  } else if (command === 'status') {
    const executed = (await migrator.executed()).map((m) => m.name);
    const pending = (await migrator.pending()).map((m) => m.name);
    console.log({ executed, pending });
  } else {
    throw new Error(`Unknown command "${command}". Use up, down or status.`);
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
