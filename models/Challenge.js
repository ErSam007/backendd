import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['Daily', 'Weekly', 'Monthly'], required: true },
  targetAmount: { type: Number, required: true }, // E.g., Save 500, or spend under 100
  xpReward: { type: Number, default: 50 },
  coinReward: { type: Number, default: 20 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;
