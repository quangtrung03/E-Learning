const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours in seconds
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  }
});

// Indexes for performance
emailVerificationSchema.index({ user: 1, verified: 1 });
emailVerificationSchema.index({ token: 1 }, { unique: true });
emailVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Generate verification token
emailVerificationSchema.methods.generateToken = function() {
  // Create a secure random token
  const crypto = require('crypto');
  this.token = crypto.randomBytes(32).toString('hex');
  return this.token;
};

// Check if token is expired
emailVerificationSchema.methods.isExpired = function() {
  const now = new Date();
  const expiryTime = new Date(this.createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  return now > expiryTime;
};

// Mark as verified
emailVerificationSchema.methods.markAsVerified = function() {
  this.verified = true;
  this.verifiedAt = new Date();
  return this.save();
};

// Static method to cleanup expired tokens
emailVerificationSchema.statics.cleanupExpired = function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: twentyFourHoursAgo },
    verified: false
  });
};

// Pre-save middleware
emailVerificationSchema.pre('save', function(next) {
  console.log('🔧 Pre-save middleware: token =', this.token);
  if (!this.token) {
    console.log('🎫 Generating token...');
    this.generateToken();
    console.log('✅ Token generated:', this.token);
  }
  next();
});

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
