import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import { dbFallback } from '../dbFallback.js';

const router = express.Router();

// Mock/Normal login & register endpoint combined for simplicity in this student ledger
router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    let user = null;
    const query = email ? { email } : { username };

    if (isMongoConnected) {
      user = await User.findOne(query);
      if (!user) {
        // Create user
        user = new User({
          username: username || email.split('@')[0],
          email: email || `${username}@student.edu`,
          password: password || 'password123',
          streak: 12,
          level: 4,
          xp: 1850,
          coins: 350,
          currency: 'INR'
        });
        await user.save();
      }
    } else {
      user = dbFallback.findOne('users', query);
      if (!user) {
        user = dbFallback.create('users', {
          username: username || email.split('@')[0],
          email: email || `${username}@student.edu`,
          password: password || 'password123',
          streak: 12,
          level: 4,
          xp: 1850,
          coins: 350,
          currency: 'INR'
        });
      }
    }

    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      process.env.JWT_SECRET || 'student_ledger_secret_key_123!',
      { expiresIn: '7d' }
    );
    res.json({ success: true, user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/update', async (req, res) => {
  const { userId, updates } = req.body;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    let user = null;
    if (isMongoConnected) {
      user = await User.findByIdAndUpdate(userId, updates, { new: true });
    } else {
      user = dbFallback.update('users', userId, updates);
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user account endpoint
router.delete('/delete/:userId', async (req, res) => {
  const { userId } = req.params;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    if (isMongoConnected) {
      await User.findByIdAndDelete(userId);
      await Expense.deleteMany({ userId });
      await Budget.deleteMany({ userId });
    } else {
      dbFallback.delete('users', userId);
      dbFallback.find('expenses', { userId }).forEach(e => dbFallback.delete('expenses', e._id));
      dbFallback.find('budgets', { userId }).forEach(b => dbFallback.delete('budgets', b._id));
    }
    res.json({ success: true, message: "User account deleted successfully" });
  } catch (err) {
    console.error("Error deleting user account:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
