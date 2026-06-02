const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Load env vars (for local `vercel dev` or direct invocation)
if (!process.env.VERCEL) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', 'server', '.env') });
}

const { connectDB } = require('../server/utils/db');
const apiRoutes = require('../server/routes/api');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure MongoDB is connected before handling any request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
