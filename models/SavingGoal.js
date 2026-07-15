import mongoose from 'mongoose';

const savingGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date, required: true },
  category: { 
    type: String, 
    enum: ['Laptop', 'Bike', 'Vacation', 'Emergency Fund', 'Education', 'Custom Goal'], 
    default: 'Custom Goal' 
  },
  milestones: [{
    amount: { type: Number, required: true },
    isAchieved: { type: Boolean, default: false }
  }],
  status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' }
}, { timestamps: true });

const SavingGoal = mongoose.model('SavingGoal', savingGoalSchema);
export default SavingGoal;
