import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  profilePhoto: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
  college: { type: String, default: '' },
  department: { type: String, default: '' },
  semester: { type: Number, default: 1 },
  bio: { type: String, default: '' },
  
  // Gamification Metrics
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  achievements: [{ type: String }], // Array of unlocked achievement IDs
  level: { type: Number, default: 1 },

  // Settings
  currency: { type: String, default: 'INR' }, // 'INR', 'USD', 'EUR', etc.
  theme: { type: String, default: 'dark' },
  notificationsEnabled: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
