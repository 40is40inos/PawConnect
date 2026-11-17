// Creates an admin account, or resets its password if it already exists.
// Usage: ADMIN_USERNAME=alice ADMIN_PASSWORD='a-long-password' npm run create-admin
require('dotenv').config();

const { sequelize } = require('../models');
const { migrate } = require('../db/migrator');
const userService = require('../services/userService');

async function main() {
  const userName = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!userName || !/^[A-Za-z0-9_]{3,30}$/.test(userName)) {
    throw new Error('Set ADMIN_USERNAME (3-30 letters, digits or underscores)');
  }
  if (!password || password.length < 12 || password.length > 72) {
    throw new Error('Set ADMIN_PASSWORD (12-72 characters)');
  }

  await migrate();
  const { created } = await userService.createAdmin(userName, password);
  console.log(created ? `Admin "${userName}" created.` : `Password for admin "${userName}" reset.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
