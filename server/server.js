const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
dotenv.config();

const path = require('path');
const fs = require('fs');
const { connectDB } = require('./utils/db');
const apiRoutes = require('./routes/api');

const app = express();

// Ensure uploads directory exists (local dev only)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production Setup: Serve React Client
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  // Catch-all to serve index.html for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  Smart Sync Server running on port ${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(`  API:    http://localhost:${PORT}/api`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`  Client: http://localhost:${PORT}/\n`);
    } else {
      console.log('');
    }
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err.message);
  console.error('Make sure MongoDB is running and MONGO_URI is set in server/.env');
  process.exit(1);
});
