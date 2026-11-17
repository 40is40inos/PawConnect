const express = require('express');
const { rateLimit } = require('express-rate-limit');
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validation/schemas');

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

  // Users. Guests can browse keepers (without contact details);
  // only keepers (and admins) can browse owners.
  router.get('/users/keepers', users.listKeepers);
  router.get('/users/owners', requireRole('PETKEEPER', 'ADMIN'), users.listOwners);
  router.patch(
    '/users/me',
    requireRole('PETKEEPER', 'PETOWNER'),
    validate(updateProfileSchema),
    users.updateMe
  );

  // Admin
  router.get('/admin/users', requireRole('ADMIN'), users.listAll);
  router.delete('/admin/users/:username', requireRole('ADMIN'), users.remove);

  return router;
}

module.exports = { createRouter };
