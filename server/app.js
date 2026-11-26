
// Load environment variables before importing application modules.
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { isDbConnected } = require('./config/db');
const { isFirebaseConfigured } = require('./config/firebase');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));

app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check
app.get('/api/health', (req, res) => {
  const database = isDbConnected();
  const firebase = isFirebaseConfigured();

  res.status(database ? 200 : 503).json({
    ok: database,
    database: database ? 'connected' : 'disconnected',
    firebaseConfigured: firebase,
  });
});

// API routes
app.use('/api/me', require('./routes/me'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/brand-partners', require('./routes/brandPartners'));
app.use('/api/admin', require('./routes/admin'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
