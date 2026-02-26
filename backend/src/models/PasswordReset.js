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
  otp: {
    type: String,
    required: true,
    length: 6
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // OTP expires after 10 minutes (industry standard)
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

// Generate secure random token and OTP
passwordResetSchema.statics.generateToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return { token, otp };
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

// Static method to find by OTP
passwordResetSchema.statics.findByOTP = function(email, otp) {
  return this.findOne({
    email: email.toLowerCase(),
    otp: otp,
    used: false
  });
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
