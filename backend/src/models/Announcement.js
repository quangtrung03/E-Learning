const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề thông báo'],
    trim: true,
    maxLength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  message: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung thông báo'],
    maxLength: [1000, 'Nội dung không được quá 1000 ký tự']
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  // Link action (optional)
  linkUrl: {
    type: String,
    default: null
  },
  linkText: {
    type: String,
    default: null
  },
  // Scheduling
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày kết thúc']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Display options
  dismissible: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0 // higher = shown first
  },
  // Target audience
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'instructors', 'admins'],
    default: 'all'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient active announcement queries
announcementSchema.index({ isActive: 1, startDate: 1, endDate: 1, priority: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
