import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  period: { 
    type: String, 
    required: true,
    enum: ['Daily', 'Weekly', 'Monthly', 'Semester', 'Yearly'] 
  },
  category: { 
    type: String, 
    default: 'All', // 'All' for global budget, or a specific category
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  alertThreshold: { type: Number, default: 80 }, // Percentage to alert user at (e.g. 80% spent)
  hasAlerted: { type: Boolean, default: false }
}, { timestamps: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
