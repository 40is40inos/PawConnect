const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db_connection');

// One review per completed booking, written by the pet owner about the keeper.
const Review = sequelize.define(
  'reviews',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bookingId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    ownerUserName: { type: DataTypes.STRING(30), allowNull: false },
    keeperUserName: { type: DataTypes.STRING(30), allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    comment: { type: DataTypes.TEXT },
  },
  { indexes: [{ fields: ['keeperUserName'] }] }
);

module.exports = { Review };
