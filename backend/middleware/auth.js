// Session handling: a signed JWT in an httpOnly cookie.
// The cookie holds only the username and role, never the password, and
// JavaScript in the browser cannot read it (httpOnly).
const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/httpError');

const COOKIE_NAME = 'session';
const SESSION_TTL_SECONDS = 60 * 60; // 1 hour

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return process.env.JWT_SECRET;
};

// True when the site is served over HTTPS. Defaults to production, and can be
// turned off (COOKIE_SECURE=false) for a production build on plain
// http://localhost, such as the Docker Compose setup.
const usesHttps = () =>
  process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax', // not sent on cross-site POST/DELETE requests (CSRF protection)
  secure: usesHttps(), // only sent over HTTPS
  path: '/',
});

function startSession(res, { userName, role }) {
  const token = jwt.sign({ role }, secret(), {
    subject: userName,
    expiresIn: SESSION_TTL_SECONDS,
    algorithm: 'HS256',
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: SESSION_TTL_SECONDS * 1000 });
}

function endSession(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

// Runs on every request: sets req.user when a valid session cookie is present.
function loadSession(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, secret(), { algorithms: ['HS256'] });
      req.user = { userName: payload.sub, role: payload.role };
    } catch {
      endSession(res); // expired or tampered with
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'You need to log in'));
  next();
}

const requireRole = (...roles) => [
  requireAuth,
  (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Not allowed'));
    next();
  },
];

module.exports = {
  startSession,
  endSession,
  loadSession,
  requireAuth,
  requireRole,
  usesHttps,
  COOKIE_NAME,
};
