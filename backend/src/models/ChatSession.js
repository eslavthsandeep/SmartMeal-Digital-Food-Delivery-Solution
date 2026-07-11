import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model', 'system'],
    required: true
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [chatMessageSchema],
  escalated: { type: Boolean, default: false }
}, {
  timestamps: true
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
