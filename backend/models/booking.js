const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db_connection');

// REQUESTED -> ACCEPTED | DECLINED (by the keeper)
// REQUESTED | ACCEPTED -> CANCELLED (by the owner)
// An ACCEPTED booking whose end date has passed counts as completed.
const BOOKING_STATUSES = ['REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED'];

const Booking = sequelize.define(
  'bookings',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ownerUserName: { type: DataTypes.STRING(30), allowNull: false },
    keeperUserName: { type: DataTypes.STRING(30), allowNull: false },
    petId: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    message: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM(...BOOKING_STATUSES),
      allowNull: false,
      defaultValue: 'REQUESTED',
    },
    // Fixed when the request is made, so later rate changes don't affect it.
    totalPrice: {
      type: DataTypes.DECIMAL(9, 2),
      allowNull: false,
      get() {
        return Number(this.getDataValue('totalPrice'));
      },
    },
  },
  {
    indexes: [
      { fields: ['keeperUserName', 'status'] },
      { fields: ['ownerUserName'] },
      { fields: ['petId'] },
    ],
  }
);

module.exports = { Booking, BOOKING_STATUSES };
