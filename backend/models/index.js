const { sequelize } = require('../utils/db_connection');
const { User, USER_TYPES, SEXES } = require('./user');
const { Admin } = require('./admin');
const { Pet, SPECIES } = require('./pet');
const { KeeperProfile } = require('./keeperProfile');
const { Booking, BOOKING_STATUSES } = require('./booking');
const { Review } = require('./review');

// Relationships. Deleting a user (admin action) removes everything that
// belongs to them through ON DELETE CASCADE foreign keys.
const cascade = { onDelete: 'CASCADE', onUpdate: 'CASCADE' };

User.hasMany(Pet, { foreignKey: 'ownerUserName', as: 'pets', ...cascade });
Pet.belongsTo(User, { foreignKey: 'ownerUserName', as: 'owner', ...cascade });

User.hasOne(KeeperProfile, { foreignKey: 'userName', as: 'keeperProfile', ...cascade });
KeeperProfile.belongsTo(User, { foreignKey: 'userName', as: 'user', ...cascade });

Booking.belongsTo(User, { foreignKey: 'ownerUserName', as: 'owner', ...cascade });
Booking.belongsTo(User, { foreignKey: 'keeperUserName', as: 'keeper', ...cascade });
Booking.belongsTo(Pet, { foreignKey: 'petId', as: 'pet', ...cascade });
Booking.hasOne(Review, { foreignKey: 'bookingId', as: 'review', ...cascade });

Review.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking', ...cascade });
Review.belongsTo(User, { foreignKey: 'ownerUserName', as: 'owner', ...cascade });
Review.belongsTo(User, { foreignKey: 'keeperUserName', as: 'keeper', ...cascade });

module.exports = {
  sequelize,
  User,
  Admin,
  Pet,
  KeeperProfile,
  Booking,
  Review,
  USER_TYPES,
  SEXES,
  SPECIES,
  BOOKING_STATUSES,
};
