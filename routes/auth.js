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
          name: username ? username.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : email.split('@')[0],
          profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
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
          name: username ? username.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : email.split('@')[0],
          profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
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

// Google token verification and signup/login endpoint
router.post('/google', async (req, res) => {
  const { token } = req.body;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    let payload = null;

    // Verify token with Google's tokeninfo API
    try {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (googleRes.ok) {
        payload = await googleRes.json();
      }
    } catch (fetchErr) {
      console.warn("Failed to verify Google token via API, attempting local decode:", fetchErr.message);
    }

    // Fallback to decode locally (useful for development fallback / offline modes)
    if (!payload) {
      payload = jwt.decode(token);
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, error: 'Invalid Google token payload' });
    }

    const { email, name, picture } = payload;
    let user = null;

    if (isMongoConnected) {
      user = await User.findOne({ email });
      if (!user) {
        // Register new Google user
        user = new User({
          username: email.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900),
          email,
          password: 'google_authenticated_' + Math.random().toString(36).slice(-8),
          name: name || email.split('@')[0],
          profilePhoto: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          streak: 12,
          level: 4,
          xp: 1850,
          coins: 350,
          currency: 'INR'
        });
        await user.save();
      }
    } else {
      user = dbFallback.findOne('users', { email });
      if (!user) {
        user = dbFallback.create('users', {
          username: email.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900),
          email,
          password: 'google_authenticated_' + Math.random().toString(36).slice(-8),
          name: name || email.split('@')[0],
          profilePhoto: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          streak: 12,
          level: 4,
          xp: 1850,
          coins: 350,
          currency: 'INR'
        });
      }
    }

    const localToken = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      process.env.JWT_SECRET || 'student_ledger_secret_key_123!',
      { expiresIn: '7d' }
    );
    res.json({ success: true, user, token: localToken });
  } catch (err) {
    console.error("Error in google auth endpoint:", err);
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
