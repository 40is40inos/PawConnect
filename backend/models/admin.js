const {  DataTypes } = require("sequelize");
const { sequelize } = require('../utils/db_connection')

const Admin = sequelize.define("admin", {
    userName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// give table to service
module.exports = { Admin }