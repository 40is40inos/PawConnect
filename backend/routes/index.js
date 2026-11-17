const express = require('express');
const { rateLimit } = require('express-rate-limit');
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const market = require('../controllers/marketplaceController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  petSchema,
  petUpdateSchema,
  keeperProfileSchema,
  bookingSchema,
  reviewSchema,
  keeperSearchSchema,
} = require('../validation/schemas');

// Express 5 forwards errors thrown in async handlers to the error handler,
// so the handlers below need no try/catch.
function createRouter() {
  const router = express.Router();

  // Slows down password guessing: N attempts per IP per 15 minutes.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.LOGIN_RATE_LIMIT) || 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many login attempts, try again later' },
  });

  // Auth
  router.post('/auth/register', validate(registerSchema), auth.register);
  router.post('/auth/login', loginLimiter, validate(loginSchema), auth.login);
  router.post('/auth/logout', auth.logout);
  router.get('/auth/me', requireAuth, auth.me);

  // Users. Only keepers (and admins) can browse owners.
  router.get('/users/owners', requireRole('PETKEEPER', 'ADMIN'), users.listOwners);
  router.patch(
    '/users/me',
    requireRole('PETKEEPER', 'PETOWNER'),
    validate(updateProfileSchema),
    users.updateMe
  );

  // Keepers. Search and profiles are public; contact details need a login.
  const keeper = requireRole('PETKEEPER');
  router.get('/keepers', validate(keeperSearchSchema, 'query'), market.searchKeepers);
  router.get('/keeper-profile', keeper, market.getKeeperProfile);
  router.put('/keeper-profile', keeper, validate(keeperProfileSchema), market.saveKeeperProfile);
  router.get('/keepers/:userName', market.getKeeper);

  // Pets: owners manage their own.
  const owner = requireRole('PETOWNER');
  router.get('/pets', owner, market.listPets);
  router.post('/pets', owner, validate(petSchema), market.createPet);
  router.patch('/pets/:id', owner, validate(petUpdateSchema), market.updatePet);
  router.delete('/pets/:id', owner, market.deletePet);

  // Bookings: owners request and cancel, keepers accept and decline.
  const member = requireRole('PETOWNER', 'PETKEEPER');
  router.get('/bookings', member, market.listBookings);
  router.get('/bookings/:id', member, market.getBooking);
  router.post('/bookings', owner, validate(bookingSchema), market.requestBooking);
  router.post('/bookings/:id/accept', keeper, market.acceptBooking);
  router.post('/bookings/:id/decline', keeper, market.declineBooking);
  router.post('/bookings/:id/cancel', owner, market.cancelBooking);
  router.post('/bookings/:id/review', owner, validate(reviewSchema), market.reviewBooking);

  // Admin
  router.get('/admin/users', requireRole('ADMIN'), users.listAll);
  router.delete('/admin/users/:username', requireRole('ADMIN'), users.remove);

  return router;
}

module.exports = { createRouter };
