const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxLength: [50, 'Họ tên không được quá 50 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, 'Vui lòng nhập email hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minLength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false // Không trả về password khi query
  },
  // Simple role system: user (default) or admin
  isAdmin: {
    type: Boolean,
    default: false
  },
  adminRequestPending: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,  // Cloudinary URL
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxLength: [500, 'Tiểu sử không được quá 500 ký tự'],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  createdCourses: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  }],
  // Social fields
  coverImage: {
    type: String,
    default: null
  },
  website: {
    type: String,
    default: null
  },
  location: {
    type: String,
    maxLength: [100, 'Vị trí không được quá 100 ký tự'],
    default: null
  },
  socialLinks: {
    facebook: { type: String, default: null },
    twitter: { type: String, default: null },
    linkedin: { type: String, default: null },
    github: { type: String, default: null },
    youtube: { type: String, default: null },
    instagram: { type: String, default: null }
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  preferences: {
    language: { type: String, enum: ['vi', 'en'], default: 'vi' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifications: {
      email: { type: Boolean, default: true },
      newFollower: { type: Boolean, default: true },
      newComment: { type: Boolean, default: true },
      newLike: { type: Boolean, default: true },
      newMessage: { type: Boolean, default: true },
      courseUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },
    privacy: {
      profilePublic: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      allowMessages: { type: String, enum: ['everyone', 'followers', 'none'], default: 'everyone' }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Every user can learn and teach - no role restrictions

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Virtual: Lấy danh sách enrollments từ Enrollment model
userSchema.virtual('enrolledCourses', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'user',
  options: { sort: { enrolledAt: -1 } }
});

// Virtual: Tổng số khóa học đã đăng ký
userSchema.virtual('totalEnrolledCourses', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'user',
  count: true
});

// Virtual: follower count
userSchema.virtual('followerCount').get(function () {
  return this.followers ? this.followers.length : 0;
});

// Virtual: following count
userSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

// Enable virtuals in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
