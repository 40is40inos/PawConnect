require('dotenv').config();

const { createApp } = require('./app');
const { migrate } = require('./db/migrator');

const port = Number(process.env.PORT) || 5000;

async function start() {
  const app = createApp(); // fails fast if JWT_SECRET is missing
  // Apply pending schema migrations on boot (one instance, so no race).
  if (process.env.RUN_MIGRATIONS !== 'false') await migrate();
  app.listen(port, () => console.log(`PawConnect API listening on http://localhost:${port}`));
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
