import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Food', 'Transport', 'Education', 'Hostel', 'Books', 'Medical', 'Entertainment', 'Travel', 'Shopping', 'Internet', 'Recharge', 'Bills', 'Emergency', 'Personal Care', 'Others'] 
  },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'NetBanking'], default: 'UPI' },
  isRecurring: { type: Boolean, default: false },
  recurrenceInterval: { type: String, enum: ['None', 'Daily', 'Weekly', 'Monthly'], default: 'None' },
  tags: [{ type: String }],
  receiptUrl: { type: String, default: '' },
  merchant: { type: String, default: '' }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
