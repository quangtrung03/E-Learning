const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề khóa học'],
    trim: true,
    maxLength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả khóa học'],
    maxLength: [1000, 'Mô tả không được quá 1000 ký tự']
  },
  instructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Khóa học phải có giảng viên']
  },
  category: {
    type: String,
    required: [true, 'Vui lòng chọn danh mục'],
    enum: {
      values: ['programming', 'design', 'business', 'marketing', 'language', 'science', 'other'],
      message: 'Danh mục không hợp lệ'
    }
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập giá khóa học'],
    min: [0, 'Giá không được âm']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Giảm giá không được âm'],
    max: [100, 'Giảm giá không được quá 100%']
  },
  thumbnail: {
    type: String,
    default: null
  },
  duration: {
    type: Number, // Thời lượng tính bằng phút
    required: [true, 'Vui lòng nhập thời lượng khóa học'],
    min: [1, 'Thời lượng phải lớn hơn 0']
  },
  lessons: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson'
  }],
  students: [{
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  requirements: [{
    type: String,
    maxLength: [200, 'Yêu cầu không được quá 200 ký tự']
  }],
  whatYouWillLearn: [{
    type: String,
    maxLength: [200, 'Mục tiêu học tập không được quá 200 ký tự']
  }],
  tags: [{
    type: String,
    trim: true,
    maxLength: [50, 'Tag không được quá 50 ký tự']
  }]
}, {
  timestamps: true
});

// Tạo index để tìm kiếm nhanh
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ price: 1 });

// Virtual để tính giá sau khi giảm giá
courseSchema.virtual('finalPrice').get(function() {
  return this.price * (1 - this.discount / 100);
});

// Populate instructor khi query
courseSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'instructor',
    select: 'name email avatar bio'
  });
  next();
});

module.exports = mongoose.model('Course', courseSchema);
