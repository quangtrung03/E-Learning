const mongoose = require('mongoose');

const FriendRequestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'canceled'],
      default: 'pending',
      index: true
    },
    respondedAt: {
      type: Date
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

FriendRequestSchema.index(
  { fromUser: 1, toUser: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

module.exports = mongoose.model('FriendRequest', FriendRequestSchema);
