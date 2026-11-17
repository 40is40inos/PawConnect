const userService = require('../services/userService');
const { startSession, endSession } = require('../middleware/auth');
const { HttpError } = require('../utils/httpError');

async function register(req, res) {
  const profile = await userService.register(req.body);
  startSession(res, { userName: profile.userName, role: profile.role });
  res.status(201).json(profile);
}

async function login(req, res) {
  const { username, password } = req.body;
  const account = await userService.authenticate(username, password);
  // Same message for unknown user and wrong password.
  if (!account) throw new HttpError(401, 'Wrong username or password');

  startSession(res, account);
  res.json(await userService.getProfile(account));
}

function logout(req, res) {
  endSession(res);
  res.status(204).end();
}

async function me(req, res) {
  res.json(await userService.getProfile(req.user));
}

module.exports = { register, login, logout, me };
