// Business logic and database access. Controllers call these functions;
// nothing here knows about HTTP requests or cookies.
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Admin } = require('../models');
const { HttpError } = require('../utils/httpError');

const saltRounds = () => Number(process.env.BCRYPT_ROUNDS) || 12;

// Fields anyone (including guests) may see in a listing.
const PUBLIC_FIELDS = ['userName', 'firstName', 'lastName', 'city', 'country', 'type'];
// Contact details are only shown to logged-in users.
const MEMBER_FIELDS = [...PUBLIC_FIELDS, 'email', 'phoneNumber'];

// Compared against when the username does not exist, so a failed login takes
// the same time whether or not the account exists (no user enumeration).
let dummyHash;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync('no-such-user', saltRounds()));

const hashPassword = (password) => bcrypt.hash(password, saltRounds());

function toProfile(user) {
  const { passwordHash, ...profile } = user.get({ plain: true });
  return { ...profile, role: profile.type };
}

async function register(data) {
  const { password, ...fields } = data;

  if (await Admin.findByPk(fields.userName)) {
    throw new HttpError(409, 'Username already exists');
  }
  const existing = await User.findOne({
    where: { [Op.or]: [{ userName: fields.userName }, { email: fields.email }] },
  });
  if (existing) {
    throw new HttpError(
      409,
      existing.userName === fields.userName ? 'Username already exists' : 'Email already exists'
    );
  }

  const user = await User.create({ ...fields, passwordHash: await hashPassword(password) });
  return toProfile(user);
}

// Returns { userName, role } on success, null on bad credentials.
async function authenticate(userName, password) {
  const admin = await Admin.scope('withPassword').findByPk(userName);
  if (admin) {
    return (await bcrypt.compare(password, admin.passwordHash))
      ? { userName: admin.userName, role: 'ADMIN' }
      : null;
  }

  const user = await User.scope('withPassword').findByPk(userName);
  const matches = await bcrypt.compare(password, user ? user.passwordHash : getDummyHash());
  return user && matches ? { userName: user.userName, role: user.type } : null;
}

async function getProfile({ userName, role }) {
  if (role === 'ADMIN') {
    const admin = await Admin.findByPk(userName);
    if (!admin) throw new HttpError(401, 'Session is no longer valid');
    return { userName: admin.userName, role: 'ADMIN' };
  }
  const user = await User.findByPk(userName);
  if (!user) throw new HttpError(401, 'Session is no longer valid');
  return toProfile(user);
}

async function listByType(type, viewer) {
  return User.findAll({
    where: { type },
    attributes: viewer ? MEMBER_FIELDS : PUBLIC_FIELDS,
    order: [['lastName', 'ASC'], ['firstName', 'ASC']],
  });
}

async function updateProfile(userName, changes) {
  const { password, currentPassword, ...fields } = changes;
  const user = await User.scope('withPassword').findByPk(userName);
  if (!user) throw new HttpError(404, 'User not found');

  if (password) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(403, 'Current password is incorrect');
    }
    fields.passwordHash = await hashPassword(password);
  }

  await user.update(fields);
  return toProfile(user);
}

const listAllUsers = () => User.findAll({ order: [['userName', 'ASC']] });

async function deleteUser(userName) {
  const deleted = await User.destroy({ where: { userName } });
  if (deleted === 0) throw new HttpError(404, 'User not found');
}

async function createAdmin(userName, password) {
  if (await User.findByPk(userName)) {
    throw new HttpError(409, 'A regular user already has this username');
  }
  const [admin, created] = await Admin.findOrCreate({
    where: { userName },
    defaults: { passwordHash: await hashPassword(password) },
  });
  if (!created) await admin.update({ passwordHash: await hashPassword(password) });
  return { created };
}

module.exports = {
  PUBLIC_FIELDS,
  MEMBER_FIELDS,
  register,
  authenticate,
  getProfile,
  listByType,
  updateProfile,
  listAllUsers,
  deleteUser,
  createAdmin,
};
