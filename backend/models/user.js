const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db_connection');

const USER_TYPES = ['PETKEEPER', 'PETOWNER'];
const SEXES = ['F', 'M', 'O'];

const User = sequelize.define(
  'users',
  {
    userName: { type: DataTypes.STRING(30), primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    // bcrypt hash only; the plain password is never stored.
    passwordHash: { type: DataTypes.STRING(60), allowNull: false },
    firstName: { type: DataTypes.STRING(50), allowNull: false },
    lastName: { type: DataTypes.STRING(50), allowNull: false },
    birthdate: { type: DataTypes.DATEONLY, allowNull: false },
    sex: { type: DataTypes.ENUM(...SEXES), allowNull: false },
    country: { type: DataTypes.STRING(60), allowNull: false },
    city: { type: DataTypes.STRING(60), allowNull: false },
    address: { type: DataTypes.STRING(120), allowNull: false },
    // A string, not an integer: Greek mobile numbers overflow a 32-bit INT
    // and an integer drops leading zeros and "+".
    phoneNumber: { type: DataTypes.STRING(20), allowNull: false },
    type: { type: DataTypes.ENUM(...USER_TYPES), allowNull: false },
  },
  {
    // Queries never return the hash unless they explicitly ask for it
    // with User.scope('withPassword').
    defaultScope: { attributes: { exclude: ['passwordHash'] } },
    scopes: { withPassword: {} },
  }
);

module.exports = { User, USER_TYPES, SEXES };
