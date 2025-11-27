const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String,
    maxLength: [100, 'Tên cuộc trò chuyện không được quá 100 ký tự'],
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Validate at least 2 participants
conversationSchema.pre('save', function(next) {
  if (this.participants.length < 2) {
    next(new Error('Cuộc trò chuyện phải có ít nhất 2 người tham gia'));
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
