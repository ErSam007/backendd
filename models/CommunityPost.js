import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const communityPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  content: { type: String, required: true },
  tags: [{ type: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked
  comments: [commentSchema]
}, { timestamps: true });

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
export default CommunityPost;
