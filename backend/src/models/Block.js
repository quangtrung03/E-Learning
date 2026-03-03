const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    blocked: {
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

BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

module.exports = mongoose.model('Block', BlockSchema);
