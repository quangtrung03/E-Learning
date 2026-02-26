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
  otp: {
    type: String,
    required: true,
    length: 6,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes - Industry standard for OTP security
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
// TTL index removed - using expires on createdAt field instead

// Generate verification token and OTP
emailVerificationSchema.methods.generateToken = function() {
  // Create a secure random token (for URL link)
  const crypto = require('crypto');
  this.token = crypto.randomBytes(32).toString('hex');
  
  // Generate 6-digit OTP (easy to enter manually)
  this.otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  return { token: this.token, otp: this.otp };
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

// Static method to find by OTP
emailVerificationSchema.statics.findByOTP = function(email, otp) {
  return this.findOne({
    email: email.toLowerCase(),
    otp: otp,
    verified: false
  });
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
  console.log('🔧 Pre-save middleware: token =', this.token, 'otp =', this.otp);
  if (!this.token || !this.otp) {
    console.log('🎫 Generating token and OTP...');
    const result = this.generateToken();
    console.log('✅ Token generated:', result.token, 'OTP:', result.otp);
  }
  next();
});

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
