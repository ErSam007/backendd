import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    default: 'Others'
  },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'UPI' },
  isRecurring: { type: Boolean, default: false },
  recurrenceInterval: { type: String, default: 'None' },
  tags: [{ type: String }],
  receiptUrl: { type: String, default: '' },
  merchant: { type: String, default: '' }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
