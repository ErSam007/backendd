import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  amount: { type: Number, required: true },
  period: { 
    type: String, 
    required: true,
    default: 'Monthly'
  },
  category: { 
    type: String, 
    default: 'All', // 'All' for global budget, or a specific category
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  alertThreshold: { type: Number, default: 80 }, // Percentage to alert user at (e.g. 80% spent)
  hasAlerted: { type: Boolean, default: false }
}, { timestamps: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
