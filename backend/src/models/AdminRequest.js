const mongoose = require('mongoose');

const adminRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Admin request phải liên kết với user']
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email']
  },
  reason: {
    type: String,
    maxLength: [500, 'Lý do không được quá 500 ký tự'],
    default: 'Yêu cầu quyền quản trị viên'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    maxLength: [500, 'Lý do từ chối không được quá 500 ký tự'],
    default: null
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
adminRequestSchema.index({ user: 1, status: 1 });
adminRequestSchema.index({ email: 1 });

module.exports = mongoose.model('AdminRequest', adminRequestSchema);