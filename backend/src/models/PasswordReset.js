const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Token expires after 1 hour (3600 seconds)
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate secure random token
passwordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Check if token is expired
passwordResetSchema.methods.isExpired = function() {
  const now = new Date();
  const expiryTime = new Date(this.createdAt.getTime() + (60 * 60 * 1000)); // 1 hour
  return now > expiryTime;
};

// Mark token as used
passwordResetSchema.methods.markAsUsed = function() {
  this.used = true;
  this.usedAt = new Date();
  return this.save();
};

// Cleanup expired or used tokens
passwordResetSchema.statics.cleanupExpired = async function() {
  const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
  
  const result = await this.deleteMany({
    $or: [
      { createdAt: { $lt: oneHourAgo } },
      { used: true }
    ]
  });
  
  return result;
};

// Index for faster queries
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
