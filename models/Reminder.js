import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['Save Money', 'Drink Water', 'Pay Fees', 'Recharge', 'Exam Fees', 'Study', 'Subscriptions', 'Bills', 'Custom Reminder'],
    default: 'Custom Reminder'
  },
  amount: { type: Number, default: 0 }, // optional cost associated with the reminder
  dueDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: true },
  pushNotification: { type: Boolean, default: true }
}, { timestamps: true });

const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
