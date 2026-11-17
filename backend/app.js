const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const { loadSession, usesHttps } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { createRouter } = require('./routes');

// Serves the built React app (FRONTEND_DIR) from the same origin as the API,
// so in production the session cookie never has to cross sites.
function serveFrontend(app, dir) {
  const indexHtml = path.join(dir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    throw new Error(`FRONTEND_DIR is set but ${indexHtml} does not exist. Build the frontend first.`);
  }

  // Hashed files under /static never change, so browsers may cache them for a year.
  app.use('/static', express.static(path.join(dir, 'static'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(dir, { index: false }));

  // Any other GET outside /api is a client-side route: answer with the app shell.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
}

// Builds the Express app without starting a server, so tests can call it
// directly with Supertest.
function createApp() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Copy .env.example to .env and set it.');
  }

  const app = express();
  // Behind a hosting proxy (Render, Docker ingress) this makes req.ip the
  // real client IP, which the login rate limiter relies on.
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Only ask browsers to upgrade to HTTPS when the site is served over HTTPS.
          upgradeInsecureRequests: usesHttps() ? [] : null,
        },
      },
    })
  );
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(loadSession);

  // Used by Docker and the hosting platform to check the app and its database.
  app.get('/api/health', async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({ status: 'ok', database: 'ok' });
    } catch {
      res.status(503).json({ status: 'error', database: 'unreachable' });
    }
  });
  app.use('/api', createRouter());

  if (process.env.FRONTEND_DIR) serveFrontend(app, path.resolve(process.env.FRONTEND_DIR));

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
