import express from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import { dbFallback } from '../dbFallback.js';

const router = express.Router();

// Get budgets
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    let list = [];
    if (isMongoConnected) {
      list = await Budget.find({ userId });
    } else {
      list = dbFallback.find('budgets', { userId });
    }
    res.json({ success: true, budgets: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configure or create budget
router.post('/', async (req, res) => {
  const { userId, amount, period, category, startDate, endDate, alertThreshold } = req.body;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    let budget = null;
    const budgetData = {
      userId,
      amount: parseFloat(amount),
      period: period || 'Monthly',
      category: category || 'All',
      startDate: startDate || new Date(),
      endDate: endDate || new Date(new Date().setMonth(new Date().getMonth() + 1)),
      alertThreshold: alertThreshold || 80
    };

    if (isMongoConnected) {
      // Check if existing budget exists for category + period
      budget = await Budget.findOne({ userId, category, period });
      if (budget) {
        budget.amount = budgetData.amount;
        await budget.save();
      } else {
        budget = new Budget(budgetData);
        await budget.save();
      }
    } else {
      budget = dbFallback.findOne('budgets', { userId, category, period });
      if (budget) {
        budget = dbFallback.update('budgets', budget._id, { amount: budgetData.amount });
      } else {
        budget = dbFallback.create('budgets', budgetData);
      }
    }
    res.json({ success: true, budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    if (isMongoConnected) {
      await Budget.findByIdAndDelete(id);
    } else {
      dbFallback.delete('budgets', id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
