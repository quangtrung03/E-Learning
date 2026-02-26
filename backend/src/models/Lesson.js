const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề bài học'],
    trim: true,
    maxLength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  description: {
    type: String,
    maxLength: [500, 'Mô tả không được quá 500 ký tự']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Bài học phải thuộc về một khóa học']
  },
  order: {
    type: Number,
    required: [true, 'Vui lòng nhập thứ tự bài học'],
    min: [1, 'Thứ tự phải lớn hơn 0']
  },
  content: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung bài học']
  },
  contentType: {
    type: String,
    enum: ['text', 'video', 'pdf', 'quiz'],
    default: 'text'
  },
  // Video storage with Cloudinary
  video: {
    provider: {
      type: String,
      enum: ['cloudinary', 'youtube', 'vimeo'],
      default: 'cloudinary'
    },
    publicId: String,           // Cloudinary public_id
    url: String,                // HTTP URL
    secureUrl: String,          // HTTPS URL (use this for playback)
    duration: Number,           // Video duration in seconds
    format: String,             // mp4, webm, etc.
    width: Number,              // Video resolution width
    height: Number,             // Video resolution height
    size: Number,               // File size in bytes
    thumbnailUrl: String,       // Auto-generated thumbnail
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading'
    },
    uploadedAt: Date,
    // Optional: Different quality versions
    transformations: [{
      quality: String,          // 'sd', 'hd', 'fullhd'
      url: String,
      width: Number,
      height: Number
    }]
  },
  // Legacy field for backward compatibility (external URLs)
  videoUrl: {
    type: String,
    default: null
  },
  duration: {
    type: Number, // Thời lượng tính bằng phút
    required: [true, 'Vui lòng nhập thời lượng bài học'],
    min: [1, 'Thời lượng phải lớn hơn 0']
  },
  resources: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['pdf', 'doc', 'image', 'link', 'other'],
      default: 'other'
    }
  }],
  isPreview: {
    type: Boolean,
    default: false // Có thể xem trước miễn phí không
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  completedBy: [{
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Tạo index
lessonSchema.index({ course: 1, order: 1 });

// Populate course khi query
lessonSchema.pre(/^find/, function(next) {
  if (this.getOptions().skipPopulate) {
    return next();
  }
  
  this.populate({
    path: 'course',
    select: 'title instructor'
  });
  next();
});

module.exports = mongoose.model('Lesson', lessonSchema);
