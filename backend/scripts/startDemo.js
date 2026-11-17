// Entry point for the public demo (see render.yaml): reset the database to
// fresh demo data, then start the server. Never use this with real data.
const path = require('path');
const { execFileSync } = require('child_process');

execFileSync(process.execPath, [path.join(__dirname, 'seedDemo.js'), '--reset-everything'], {
  stdio: 'inherit',
});
require('../server');
