const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    maxLength: [100, 'Tiêu đề đánh giá không được quá 100 ký tự']
  },
  comment: {
    type: String,
    required: true,
    maxLength: [1000, 'Bình luận không được quá 1000 ký tự']
  },
  pros: [{
    type: String,
    maxLength: [200, 'Ưu điểm không được quá 200 ký tự']
  }],
  cons: [{
    type: String,
    maxLength: [200, 'Nhược điểm không được quá 200 ký tự']
  }],
  aspects: {
    contentQuality: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    instructorQuality: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    courseStructure: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    difficulty: {
      type: String,
      enum: ['very-easy', 'easy', 'medium', 'hard', 'very-hard'],
      default: null
    }
  },
  helpful: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    helpfulAt: {
      type: Date,
      default: Date.now
    }
  }],
  reported: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  verified: {
    type: Boolean,
    default: false // True if user completed the course
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  timeSpentOnCourse: {
    type: Number, // in minutes
    default: 0
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  instructorResponse: {
    content: {
      type: String,
      maxLength: [500, 'Phản hồi của giảng viên không được quá 500 ký tự']
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'flagged', 'removed'],
    default: 'active'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per course
reviewSchema.index({ course: 1, user: 1 }, { unique: true });

// Other indexes for better performance
reviewSchema.index({ course: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ verified: 1, status: 1 });

// Virtual for getting helpful count
reviewSchema.virtual('helpfulCount').get(function() {
  return this.helpful.length;
});

// Virtual for getting report count
reviewSchema.virtual('reportCount').get(function() {
  return this.reported.length;
});

// Method to calculate overall aspect rating
reviewSchema.methods.getAverageAspectRating = function() {
  const aspects = this.aspects;
  const ratings = [
    aspects.contentQuality,
    aspects.instructorQuality,
    aspects.courseStructure,
    aspects.valueForMoney
  ].filter(rating => rating !== null);
  
  if (ratings.length === 0) return null;
  
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
};

module.exports = mongoose.model('Review', reviewSchema);