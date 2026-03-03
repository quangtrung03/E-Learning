const mongoose = require('mongoose');

const courseSectionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Section phải thuộc về một khóa học'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề section'],
    trim: true,
    maxLength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxLength: [500, 'Mô tả không được quá 500 ký tự']
  },
  order: {
    type: Number,
    required: [true, 'Vui lòng nhập thứ tự section'],
    min: [1, 'Thứ tự phải lớn hơn 0']
  }
}, {
  timestamps: true
});

courseSectionSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('CourseSection', courseSectionSchema);
