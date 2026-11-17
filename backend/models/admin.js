const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db_connection');

// Admin accounts are created only from the command line
// (npm run create-admin), never through the public API.
const Admin = sequelize.define(
  'admin',
  {
    userName: { type: DataTypes.STRING(30), primaryKey: true },
    passwordHash: { type: DataTypes.STRING(60), allowNull: false },
  },
  {
    defaultScope: { attributes: { exclude: ['passwordHash'] } },
    scopes: { withPassword: {} },
  }
);

module.exports = { Admin };
