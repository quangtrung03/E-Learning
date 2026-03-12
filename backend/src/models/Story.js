const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaPublicId: String,
  mediaType: {
    type: String,
    enum: ['image', 'video', 'text'],
    default: 'image'
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [300, 'Caption không được vượt quá 300 ký tự']
  },
  // Background color for text stories
  backgroundColor: {
    type: String,
    default: '#3B82F6'
  },
  // Text overlay for image stories
  textOverlay: String,
  // Link attached to story
  linkUrl: String,
  linkLabel: String,
  // Viewers and reactions
  viewers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now },
    reaction: {
      type: String,
      enum: ['like', 'love', 'wow', 'haha', 'fire', null],
      default: null
    }
  }],
  // Story replies (private messages to author)
  replies: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    sentAt: { type: Date, default: Date.now }
  }],
  // Story expires 24 hours after creation
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    index: { expires: 0 } // TTL index - auto delete
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ isActive: 1 });

// Virtual: view count
storySchema.virtual('viewCount').get(function () {
  return this.viewers ? this.viewers.length : 0;
});

// Virtual: is expired
storySchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

storySchema.set('toJSON', { virtuals: true });
storySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Story', storySchema);
