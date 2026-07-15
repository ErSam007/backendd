import express from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import { dbFallback } from '../dbFallback.js';

const router = express.Router();

// Get all expenses for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    let list = [];
    if (isMongoConnected) {
      list = await Expense.find({ userId }).sort({ date: -1 });
    } else {
      list = dbFallback.find('expenses', { userId }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    res.json({ success: true, expenses: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  const { userId, amount, category, description, date, paymentMethod, tags, merchant } = req.body;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    let newExpense = null;
    const expenseData = {
      userId,
      amount: parseFloat(amount),
      category,
      description: description || category,
      date: date || new Date().toISOString(),
      paymentMethod: paymentMethod || 'UPI',
      tags: tags || [],
      merchant: merchant || ''
    };

    if (isMongoConnected) {
      newExpense = new Expense(expenseData);
      await newExpense.save();
    } else {
      newExpense = dbFallback.create('expenses', expenseData);
    }
    res.json({ success: true, expense: newExpense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    if (isMongoConnected) {
      await Expense.findByIdAndDelete(id);
    } else {
      dbFallback.delete('expenses', id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
