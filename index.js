import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import dns from 'dns';

// Fix for Node.js querySrv ECONNREFUSED issues on Windows
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('DNS resolvers configured to Google DNS (8.8.8.8)');
} catch (e) {
  console.warn('Failed to set public DNS servers, using system default.', e);
}

// Routes
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import budgetRoutes from './routes/budgets.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Smart Student Expense Tracker API Gateway', timestamp: new Date() });
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

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas database');
    app.listen(PORT, () => {
      console.log(`Express API Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.warn('MongoDB Atlas connection failed. Please check MONGODB_URI in your .env file.');
    console.error('Mongoose connection error details:', err);
    console.warn('Running server in local offline fallback mode...');
    app.listen(PORT, () => {
      console.log(`Express API Server running on port ${PORT} (Offline Mode)`);
    });
  });
