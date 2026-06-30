// server.js — IronCore Gym REST API

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── MIDDLEWARE ──────────────────────────────────────────────────────
app.use(cors());                        // Allow all origins (restrict in production)
app.use(express.json());                // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// ── REQUEST LOGGER (dev) ────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── ROUTES ──────────────────────────────────────────────────────────
app.use('/api/members',   require('./routes/members'));
app.use('/api/plans',     require('./routes/plans'));
app.use('/api/trainers',  require('./routes/trainers'));
app.use('/api/classes',   require('./routes/classes'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ── ROOT ────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message: '💪 IronCore Gym API is running',
    version: '1.0.0',
    endpoints: {
      dashboard: 'GET  /api/dashboard',
      members:   'GET | POST | PUT | DELETE  /api/members',
      plans:     'GET | POST | PUT | DELETE  /api/plans',
      trainers:  'GET | POST | PUT | DELETE  /api/trainers',
      classes:   'GET | POST | DELETE        /api/classes',
      bookings:  'GET | POST | DELETE        /api/classes/:id/bookings',
    }
  });
});

// ── 404 HANDLER ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── GLOBAL ERROR HANDLER ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── START ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API docs:  http://localhost:${PORT}/\n`);
});
