// Initial schema: every table the app needs, with foreign keys and indexes.
// Each later schema change gets its own migration file; never edit this one
// after it has run on a real database.
const { DataTypes } = require('sequelize');

const cascade = { onDelete: 'CASCADE', onUpdate: 'CASCADE' };
const userRef = { model: 'users', key: 'userName' };

const timestamps = {
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
};

// Postgres keeps ENUM types after their table is dropped.
const POSTGRES_ENUMS = ['enum_users_sex', 'enum_users_type', 'enum_pets_species', 'enum_bookings_status'];

module.exports = {
  async up({ context: qi }) {
    await qi.createTable('users', {
      userName: { type: DataTypes.STRING(30), primaryKey: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(60), allowNull: false },
      firstName: { type: DataTypes.STRING(50), allowNull: false },
      lastName: { type: DataTypes.STRING(50), allowNull: false },
      birthdate: { type: DataTypes.DATEONLY, allowNull: false },
      sex: { type: DataTypes.ENUM('F', 'M', 'O'), allowNull: false },
      country: { type: DataTypes.STRING(60), allowNull: false },
      city: { type: DataTypes.STRING(60), allowNull: false },
      address: { type: DataTypes.STRING(120), allowNull: false },
      phoneNumber: { type: DataTypes.STRING(20), allowNull: false },
      type: { type: DataTypes.ENUM('PETKEEPER', 'PETOWNER'), allowNull: false },
      ...timestamps,
    });

    await qi.createTable('admins', {
      userName: { type: DataTypes.STRING(30), primaryKey: true },
      passwordHash: { type: DataTypes.STRING(60), allowNull: false },
      ...timestamps,
    });

    await qi.createTable('keeper_profiles', {
      userName: { type: DataTypes.STRING(30), primaryKey: true, references: userRef, ...cascade },
      bio: { type: DataTypes.TEXT, allowNull: false },
      dailyRate: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
      acceptedSpecies: { type: DataTypes.STRING(200), allowNull: false },
      ...timestamps,
    });

    await qi.createTable('pets', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      ownerUserName: { type: DataTypes.STRING(30), allowNull: false, references: userRef, ...cascade },
      name: { type: DataTypes.STRING(40), allowNull: false },
      species: {
        type: DataTypes.ENUM('DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'REPTILE', 'FISH', 'OTHER'),
        allowNull: false,
      },
      breed: { type: DataTypes.STRING(60) },
      birthYear: { type: DataTypes.INTEGER },
      weightKg: { type: DataTypes.DECIMAL(5, 2) },
      careNotes: { type: DataTypes.TEXT },
      ...timestamps,
      deletedAt: { type: DataTypes.DATE }, // soft delete
    });
    await qi.addIndex('pets', ['ownerUserName']);

    await qi.createTable('bookings', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      ownerUserName: { type: DataTypes.STRING(30), allowNull: false, references: userRef, ...cascade },
      keeperUserName: { type: DataTypes.STRING(30), allowNull: false, references: userRef, ...cascade },
      petId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'pets', key: 'id' },
        ...cascade,
      },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      endDate: { type: DataTypes.DATEONLY, allowNull: false },
      message: { type: DataTypes.TEXT },
      status: {
        type: DataTypes.ENUM('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'REQUESTED',
      },
      totalPrice: { type: DataTypes.DECIMAL(9, 2), allowNull: false },
      ...timestamps,
    });
    await qi.addIndex('bookings', ['keeperUserName', 'status']);
    await qi.addIndex('bookings', ['ownerUserName']);
    await qi.addIndex('bookings', ['petId']);

    await qi.createTable('reviews', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'bookings', key: 'id' },
        ...cascade,
      },
      ownerUserName: { type: DataTypes.STRING(30), allowNull: false, references: userRef, ...cascade },
      keeperUserName: { type: DataTypes.STRING(30), allowNull: false, references: userRef, ...cascade },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT },
      ...timestamps,
    });
    await qi.addIndex('reviews', ['keeperUserName']);
  },

  async down({ context: qi }) {
    for (const table of ['reviews', 'bookings', 'pets', 'keeper_profiles', 'admins', 'users']) {
      await qi.dropTable(table, {}); // the options object is required by the Postgres dialect
    }
    if (qi.sequelize.getDialect() === 'postgres') {
      for (const type of POSTGRES_ENUMS) {
        await qi.sequelize.query(`DROP TYPE IF EXISTS "${type}"`);
      }
    }
  },
};
