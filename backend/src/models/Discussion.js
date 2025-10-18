const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxLength: [2000, 'Nội dung trả lời không được quá 2000 ký tự']
  },
  parentReply: {
    type: mongoose.Schema.ObjectId,
    default: null // For nested replies
  },
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const discussionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson',
    default: null
  },
  title: {
    type: String,
    required: true,
    maxLength: [200, 'Tiêu đề thảo luận không được quá 200 ký tự']
  },
  content: {
    type: String,
    required: true,
    maxLength: [5000, 'Nội dung thảo luận không được quá 5000 ký tự']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'question', 'announcement', 'assignment', 'technical'],
    default: 'general'
  },
  tags: [{
    type: String,
    maxLength: [30, 'Tag không được quá 30 ký tự']
  }],
  replies: [replySchema],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  pinnedAt: {
    type: Date,
    default: null
  },
  locked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  lockedAt: {
    type: Date,
    default: null
  },
  lockReason: {
    type: String,
    default: null
  },
  solved: {
    type: Boolean,
    default: false
  },
  solvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  bestAnswer: {
    type: mongoose.Schema.ObjectId,
    default: null // Reference to reply ID
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for getting reply count
discussionSchema.virtual('replyCount').get(function() {
  return this.replies.filter(reply => !reply.isDeleted).length;
});

// Virtual for getting like count
discussionSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to update last activity
discussionSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Index for better performance
discussionSchema.index({ course: 1, category: 1 });
discussionSchema.index({ author: 1 });
discussionSchema.index({ pinned: -1, lastActivity: -1 });
discussionSchema.index({ tags: 1 });
discussionSchema.index({ lesson: 1 });

module.exports = mongoose.model('Discussion', discussionSchema);