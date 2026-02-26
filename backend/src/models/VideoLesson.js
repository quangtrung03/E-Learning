const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxLength: [200, 'Tiêu đề chapter không được quá 200 ký tự']
  },
  timestamp: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    maxLength: [500, 'Mô tả chapter không được quá 500 ký tự']
  }
});

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxLength: [200, 'Tên tài liệu không được quá 200 ký tự']
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'doc', 'slides', 'code', 'other'],
    required: true
  },
  size: {
    type: Number,
    default: 0
  }
});

const videoLessonSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson',
    required: true
  },
  // Cloudinary video metadata
  cloudinary: {
    publicId: String,
    secureUrl: String,
    format: String,
    duration: Number,
    width: Number,
    height: Number,
    size: Number,
    thumbnailUrl: String
  },
  // Legacy videoUrl for backward compatibility
  videoUrl: {
    type: String,
    required: false
  },
  videoDuration: {
    type: Number,
    required: true,
    min: 0
  },
  videoQuality: {
    type: String,
    enum: ['360p', '480p', '720p', '1080p'],
    default: '720p'
  },
  chapters: [chapterSchema],
  transcripts: {
    type: String,
    default: null
  },
  subtitles: [{
    language: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  downloadableResources: [resourceSchema],
  allowDownload: {
    type: Boolean,
    default: true
  },
  watchCount: {
    type: Number,
    default: 0
  },
  averageWatchTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
videoLessonSchema.index({ lesson: 1 });
videoLessonSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VideoLesson', videoLessonSchema);