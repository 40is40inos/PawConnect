const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db_connection');

const SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'REPTILE', 'FISH', 'OTHER'];

const Pet = sequelize.define(
  'pets',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ownerUserName: { type: DataTypes.STRING(30), allowNull: false },
    name: { type: DataTypes.STRING(40), allowNull: false },
    species: { type: DataTypes.ENUM(...SPECIES), allowNull: false },
    breed: { type: DataTypes.STRING(60) },
    birthYear: { type: DataTypes.INTEGER },
    weightKg: {
      type: DataTypes.DECIMAL(5, 2),
      get() {
        const value = this.getDataValue('weightKg');
        return value == null ? null : Number(value);
      },
    },
    // Feeding, medication, walks: what the keeper needs to know.
    careNotes: { type: DataTypes.TEXT },
  },
  {
    // Deleting a pet only hides it, so past bookings and reviews keep their history.
    paranoid: true,
    indexes: [{ fields: ['ownerUserName'] }],
  }
);

module.exports = { Pet, SPECIES };
