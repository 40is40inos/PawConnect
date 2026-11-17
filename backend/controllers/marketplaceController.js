const petService = require('../services/petService');
const keeperService = require('../services/keeperService');
const bookingService = require('../services/bookingService');
const { HttpError } = require('../utils/httpError');

// Route ids must be positive integers; anything else simply doesn't exist.
function idParam(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Not found');
  return id;
}

const me = (req) => req.user.userName;

// ---- pets (owners) ----
const listPets = async (req, res) => res.json(await petService.listMine(me(req)));
const createPet = async (req, res) => res.status(201).json(await petService.create(me(req), req.body));
const updatePet = async (req, res) => res.json(await petService.update(me(req), idParam(req), req.body));
const deletePet = async (req, res) => {
  await petService.remove(me(req), idParam(req));
  res.status(204).end();
};

// ---- keepers ----
const searchKeepers = async (req, res) => res.json(await keeperService.search(req.validQuery, req.user));
const getKeeper = async (req, res) => res.json(await keeperService.getKeeper(req.params.userName, req.user));
const getKeeperProfile = async (req, res) => res.json(await keeperService.getOwnProfile(me(req)));
const saveKeeperProfile = async (req, res) => res.json(await keeperService.saveOwnProfile(me(req), req.body));

// ---- bookings ----
const listBookings = async (req, res) => res.json(await bookingService.listForUser(req.user));
const getBooking = async (req, res) => res.json(await bookingService.getForUser(idParam(req), req.user));
const requestBooking = async (req, res) =>
  res.status(201).json(await bookingService.request(me(req), req.body));
const acceptBooking = async (req, res) => res.json(await bookingService.accept(me(req), idParam(req)));
const declineBooking = async (req, res) => res.json(await bookingService.decline(me(req), idParam(req)));
const cancelBooking = async (req, res) => res.json(await bookingService.cancel(me(req), idParam(req)));
const reviewBooking = async (req, res) =>
  res.status(201).json(await bookingService.review(me(req), idParam(req), req.body));

module.exports = {
  listPets,
  createPet,
  updatePet,
  deletePet,
  searchKeepers,
  getKeeper,
  getKeeperProfile,
  saveKeeperProfile,
  listBookings,
  getBooking,
  requestBooking,
  acceptBooking,
  declineBooking,
  cancelBooking,
  reviewBooking,
};
