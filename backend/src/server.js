/**
 * EduSense Backend Server
 * Express.js REST API with authentication, ML pipeline proxy, LLM guidance, and data management.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models/db');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health and Info Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'EduSense Backend API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// Centralized 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server if directly executed
if (require.main === module) {
  db.ready
    .then(() => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[EduSense Backend] Server listening on http://0.0.0.0:${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`[EduSense Backend] Database initialization failed: ${err.message}`);
      process.exitCode = 1;
    });
}

module.exports = app;
