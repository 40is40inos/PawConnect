const { Op } = require('sequelize');
const { sequelize, Booking, Pet, User, KeeperProfile, Review } = require('../models');
const { HttpError } = require('../utils/httpError');
const { todayISO, daysInclusive } = require('../utils/dates');

const ACTIVE = ['REQUESTED', 'ACCEPTED'];

// Two date ranges overlap when each starts on or before the other ends.
const overlaps = (startDate, endDate) => ({
  startDate: { [Op.lte]: endDate },
  endDate: { [Op.gte]: startDate },
});

async function request(ownerUserName, { keeperUserName, petId, startDate, endDate, message }) {
  const pet = await Pet.findByPk(petId);
  if (!pet || pet.ownerUserName !== ownerUserName) throw new HttpError(404, 'Pet not found');

  const profile = await KeeperProfile.findByPk(keeperUserName);
  if (!profile) throw new HttpError(404, 'Keeper not found');
  if (!profile.acceptedSpecies.includes(pet.species)) {
    throw new HttpError(422, `This keeper does not look after ${pet.species.toLowerCase()}s`);
  }

  const clash = await Booking.count({
    where: { petId, status: { [Op.in]: ACTIVE }, ...overlaps(startDate, endDate) },
  });
  if (clash > 0) {
    throw new HttpError(409, `${pet.name} already has a booking for some of these dates`);
  }

  const totalPrice = Math.round(daysInclusive(startDate, endDate) * profile.dailyRate * 100) / 100;
  const booking = await Booking.create({
    ownerUserName,
    keeperUserName,
    petId,
    startDate,
    endDate,
    message,
    totalPrice,
  });
  return getForUser(booking.id, { userName: ownerUserName, role: 'PETOWNER' });
}

// Loads a booking and checks that `field` (ownerUserName or keeperUserName)
// belongs to the user. Other people's bookings answer 404.
async function findOwnBooking(id, field, userName, options = {}) {
  const booking = await Booking.findByPk(id, options);
  if (!booking || booking[field] !== userName) throw new HttpError(404, 'Booking not found');
  return booking;
}

function assertStatus(booking, allowed) {
  if (!allowed.includes(booking.status)) {
    throw new HttpError(409, `This booking is already ${booking.status.toLowerCase()}`);
  }
}

// Accepting runs in a transaction that locks the keeper's profile row, so two
// overlapping requests can never both be accepted, even if the keeper clicks
// "accept" on both at the same moment (row locks apply on MySQL).
async function accept(keeperUserName, id) {
  await sequelize.transaction(async (transaction) => {
    await KeeperProfile.findByPk(keeperUserName, { transaction, lock: transaction.LOCK.UPDATE });
    const booking = await findOwnBooking(id, 'keeperUserName', keeperUserName, { transaction });
    assertStatus(booking, ['REQUESTED']);
    if (booking.startDate < todayISO()) {
      throw new HttpError(409, 'The start date has already passed');
    }

    const clash = await Booking.findOne({
      where: {
        keeperUserName,
        status: 'ACCEPTED',
        id: { [Op.ne]: booking.id },
        ...overlaps(booking.startDate, booking.endDate),
      },
      transaction,
    });
    if (clash) {
      throw new HttpError(409, 'You already accepted another booking for overlapping dates');
    }

    await booking.update({ status: 'ACCEPTED' }, { transaction });
  });
  return getForUser(id, { userName: keeperUserName, role: 'PETKEEPER' });
}

async function decline(keeperUserName, id) {
  const booking = await findOwnBooking(id, 'keeperUserName', keeperUserName);
  assertStatus(booking, ['REQUESTED']);
  await booking.update({ status: 'DECLINED' });
  return getForUser(id, { userName: keeperUserName, role: 'PETKEEPER' });
}

// Owners can withdraw a request at any time, and cancel an accepted booking
// until the stay starts.
async function cancel(ownerUserName, id) {
  const booking = await findOwnBooking(id, 'ownerUserName', ownerUserName);
  assertStatus(booking, ACTIVE);
  if (booking.status === 'ACCEPTED' && booking.startDate <= todayISO()) {
    throw new HttpError(409, 'An accepted booking can only be cancelled before it starts');
  }
  await booking.update({ status: 'CANCELLED' });
  return getForUser(id, { userName: ownerUserName, role: 'PETOWNER' });
}

const isCompleted = (booking) => booking.status === 'ACCEPTED' && booking.endDate < todayISO();

async function review(ownerUserName, id, { rating, comment }) {
  const booking = await findOwnBooking(id, 'ownerUserName', ownerUserName);
  if (!isCompleted(booking)) {
    throw new HttpError(409, 'You can review a keeper after an accepted stay has ended');
  }
  if (await Review.findOne({ where: { bookingId: booking.id } })) {
    throw new HttpError(409, 'You already reviewed this booking');
  }
  await Review.create({
    bookingId: booking.id,
    ownerUserName,
    keeperUserName: booking.keeperUserName,
    rating,
    comment,
  });
  return getForUser(id, { userName: ownerUserName, role: 'PETOWNER' });
}

// ---- reading bookings ----

const PERSON = ['userName', 'firstName', 'lastName', 'city', 'email', 'phoneNumber'];

const bookingIncludes = [
  {
    model: Pet,
    as: 'pet',
    paranoid: false, // still show pets that were deleted later
    attributes: ['id', 'name', 'species', 'breed', 'birthYear', 'weightKg', 'careNotes'],
  },
  { model: User, as: 'owner', attributes: PERSON },
  { model: User, as: 'keeper', attributes: PERSON },
  { model: Review, as: 'review', attributes: ['rating', 'comment', 'createdAt'] },
];

// Shapes a booking for one side. Each side sees the other person's phone and
// email only once the booking is accepted.
function toView(booking, role) {
  const { owner, keeper, ...rest } = booking.get({ plain: true });
  const other = role === 'PETKEEPER' ? owner : keeper;
  const shareContact = booking.status === 'ACCEPTED';
  const completed = isCompleted(booking);

  return {
    ...rest,
    completed,
    canReview: role === 'PETOWNER' && completed && !rest.review,
    otherParty: other && {
      userName: other.userName,
      firstName: other.firstName,
      lastName: other.lastName,
      city: other.city,
      ...(shareContact ? { email: other.email, phoneNumber: other.phoneNumber } : {}),
    },
  };
}

async function getForUser(id, { userName, role }) {
  const field = role === 'PETKEEPER' ? 'keeperUserName' : 'ownerUserName';
  const booking = await Booking.findOne({ where: { id, [field]: userName }, include: bookingIncludes });
  if (!booking) throw new HttpError(404, 'Booking not found');
  return toView(booking, role);
}

async function listForUser({ userName, role }) {
  const field = role === 'PETKEEPER' ? 'keeperUserName' : 'ownerUserName';
  const bookings = await Booking.findAll({
    where: { [field]: userName },
    include: bookingIncludes,
    order: [
      ['startDate', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  return bookings.map((b) => toView(b, role));
}

module.exports = { request, accept, decline, cancel, review, listForUser, getForUser };
