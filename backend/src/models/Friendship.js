const mongoose = require('mongoose');

const FriendshipSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

FriendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', FriendshipSchema);
