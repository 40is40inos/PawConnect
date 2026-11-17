const { UniqueConstraintError } = require('sequelize');
const { HttpError } = require('../utils/httpError');

// Turns thrown errors into JSON responses. Unexpected errors are logged
// server-side and answered with a generic message, so no internals leak.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ error: 'Username or email already exists' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong' });
}

module.exports = { errorHandler };
