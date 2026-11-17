const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db_connection');

// What a pet keeper offers. Keepers only appear in search once they have one.
const KeeperProfile = sequelize.define('keeper_profiles', {
  userName: { type: DataTypes.STRING(30), primaryKey: true },
  bio: { type: DataTypes.TEXT, allowNull: false },
  dailyRate: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: false,
    get() {
      return Number(this.getDataValue('dailyRate'));
    },
  },
  // Stored as ",DOG,CAT," so a portable LIKE '%,DOG,%' query can filter by
  // species on both MySQL and SQLite. The API sees a plain array.
  acceptedSpecies: {
    type: DataTypes.STRING(200),
    allowNull: false,
    get() {
      return (this.getDataValue('acceptedSpecies') || '').split(',').filter(Boolean);
    },
    set(species) {
      this.setDataValue('acceptedSpecies', `,${species.join(',')},`);
    },
  },
});

module.exports = { KeeperProfile };
