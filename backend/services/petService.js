const { Op } = require('sequelize');
const { Pet, Booking } = require('../models');
const { HttpError } = require('../utils/httpError');
const { todayISO } = require('../utils/dates');

const listMine = (ownerUserName) =>
  Pet.findAll({ where: { ownerUserName }, order: [['name', 'ASC']] });

const create = (ownerUserName, data) => Pet.create({ ...data, ownerUserName });

// Answers 404 (not 403) for other people's pets, so pet ids can't be probed.
async function findOwned(ownerUserName, id) {
  const pet = await Pet.findByPk(id);
  if (!pet || pet.ownerUserName !== ownerUserName) throw new HttpError(404, 'Pet not found');
  return pet;
}

async function update(ownerUserName, id, changes) {
  const pet = await findOwned(ownerUserName, id);
  return pet.update(changes);
}

async function remove(ownerUserName, id) {
  const pet = await findOwned(ownerUserName, id);
  const upcoming = await Booking.count({
    where: {
      petId: pet.id,
      status: { [Op.in]: ['REQUESTED', 'ACCEPTED'] },
      endDate: { [Op.gte]: todayISO() },
    },
  });
  if (upcoming > 0) {
    throw new HttpError(409, `${pet.name} has upcoming bookings. Cancel them first.`);
  }
  await pet.destroy(); // soft delete: past bookings keep showing the pet
}

module.exports = { listMine, create, update, remove };
