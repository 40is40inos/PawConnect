const { sequelize } = require('../utils/db_connection');
const { User, USER_TYPES, SEXES } = require('./user');
const { Admin } = require('./admin');

// Creates missing tables; existing tables and rows are left untouched.
const initDB = () => sequelize.sync();

module.exports = { sequelize, User, Admin, USER_TYPES, SEXES, initDB };
