import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import dns from 'dns';

// Fix for Node.js querySrv ECONNREFUSED issues on Windows local dev
if (process.platform === 'win32') {
  dns.setDefaultResultOrder('ipv4first');
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('DNS resolvers configured to Google DNS (8.8.8.8) on Windows');
  } catch (e) {
    console.warn('Failed to set public DNS servers, using system default.', e);
  }
}

// Routes
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import budgetRoutes from './routes/budgets.js';
import predictRoutes from './routes/predict.js';
import ocrRoutes from './routes/ocr.js';
import voiceParseRoutes from './routes/voice-parse.js';
import mobileDeviceRoutes from './routes/mobile-device.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS Configuration supporting Localhost, Netlify, Render, and Vercel deployments
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost') || 
      origin.includes('netlify.app') ||
      origin.includes('onrender.com') ||
      origin.includes('vercel.app')
    ) {
      return callback(null, true);
    }
    // Allow any other origin as fallback for development/demo
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/voice-parse', voiceParseRoutes);
app.use('/api/mobile-device', mobileDeviceRoutes);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ 
    status: 'ok', 
    database: dbStatusMap[mongoose.connection.readyState] || 'unknown',
    service: 'Smart Student Expense Tracker API Gateway', 
    timestamp: new Date() 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Cron job for daily checkin / notification reminders
cron.schedule('0 9 * * *', () => {
  console.log('Running daily scheduled budget checkin and notification job...');
  // Logic to calculate daily budget limits and send alerts
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-expense-tracker';

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection active and established');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost / disconnected');
});

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
})
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas database');
    app.listen(PORT, () => {
      console.log(`Express API Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.warn('MongoDB Atlas connection failed. Please check MONGODB_URI in your environment variables.');
    console.error('Mongoose connection error details:', err.message);
    console.warn('Running server in local offline fallback mode...');
    app.listen(PORT, () => {
      console.log(`Express API Server running on port ${PORT} (Offline Mode)`);
    });
  });
