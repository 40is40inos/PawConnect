const userService = require('../services/userService');

async function listKeepers(req, res) {
  res.json(await userService.listByType('PETKEEPER', req.user));
}

async function listOwners(req, res) {
  res.json(await userService.listByType('PETOWNER', req.user));
}

// Users can only edit their own profile: the username comes from the
// session, never from the URL or body.
async function updateMe(req, res) {
  res.json(await userService.updateProfile(req.user.userName, req.body));
}

async function listAll(req, res) {
  res.json(await userService.listAllUsers());
}

async function remove(req, res) {
  await userService.deleteUser(req.params.username);
  res.status(204).end();
}

module.exports = { listKeepers, listOwners, updateMe, listAll, remove };
