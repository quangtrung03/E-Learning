const mongoose = require('mongoose');
const crypto = require('crypto');

const adminRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Admin request phải liên kết với user']
  },
  // Bước 1: Thông tin cơ bản từ user
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email']
  },
  
  // Token validation cho link xác thực
  validationToken: {
    type: String,
    required: true,
    unique: true
  },
  validationTokenExpires: {
    type: Date,
    required: true
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  validatedAt: {
    type: Date,
    default: null
  },
  
  // Bước 2: Thông tin chi tiết cá nhân (điền sau khi validate)
  fullName: {
    type: String,
    maxLength: [100, 'Họ tên không được quá 100 ký tự']
  },
  citizenId: {
    type: String,
    maxLength: [12, 'Số CCCD không hợp lệ'],
    minLength: [9, 'Số CCCD không hợp lệ']
  },
  dateOfBirth: {
    type: Date
  },
  phone: {
    type: String,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  address: {
    type: String,
    maxLength: [200, 'Địa chỉ không được quá 200 ký tự']
  },
  occupation: {
    type: String,
    maxLength: [100, 'Nghề nghiệp không được quá 100 ký tự']
  },
  experience: {
    type: String,
    maxLength: [1000, 'Kinh nghiệm không được quá 1000 ký tự']
  },
  reason: {
    type: String,
    maxLength: [500, 'Lý do không được quá 500 ký tự']
  },
  
  // Trạng thái và xử lý
  status: {
    type: String,
    enum: ['pending_validation', 'pending_approval', 'approved', 'rejected'],
    default: 'pending_validation'
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
  },
  
  // Các file đính kèm (nếu cần)
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }]
}, {
  timestamps: true
});

// Tạo validation token trước khi save
adminRequestSchema.pre('save', function(next) {
  if (this.isNew && !this.validationToken) {
    this.validationToken = crypto.randomBytes(32).toString('hex');
    // Token có hiệu lực trong 24 giờ
    this.validationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Method kiểm tra token còn hiệu lực không
adminRequestSchema.methods.isTokenValid = function() {
  return this.validationTokenExpires > Date.now();
};

// Method tạo validation URL
adminRequestSchema.methods.getValidationURL = function(baseURL) {
  return `${baseURL}/admin/validate/${this.validationToken}`;
};

// Method đánh dấu đã validate
adminRequestSchema.methods.markAsValidated = function() {
  this.isValidated = true;
  this.validatedAt = new Date();
  this.status = 'pending_approval';
  return this.save();
};

// Index để tìm kiếm nhanh
adminRequestSchema.index({ user: 1, status: 1 });
adminRequestSchema.index({ email: 1 });
adminRequestSchema.index({ validationToken: 1 });
adminRequestSchema.index({ citizenId: 1 });

module.exports = mongoose.model('AdminRequest', adminRequestSchema);