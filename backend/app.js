const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { loadSession } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { createRouter } = require('./routes');

// Builds the Express app without starting a server, so tests can call it
// directly with Supertest.
function createApp() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Copy .env.example to .env and set it.');
  }

  const app = express();
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(loadSession);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', createRouter());

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
