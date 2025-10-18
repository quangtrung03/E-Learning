const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  certificateName: {
    type: String,
    required: true
  },
  completionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null // null means never expires
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    required: true
  },
  certificateUrl: {
    type: String,
    required: true
  },
  certificateHash: {
    type: String,
    required: true,
    unique: true
  },
  verified: {
    type: Boolean,
    default: true
  },
  issuedBy: {
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    signature: {
      type: String,
      default: null
    }
  },
  courseDuration: {
    type: Number, // in hours
    required: true
  },
  skills: [{
    type: String
  }],
  metadata: {
    totalLessons: {
      type: Number,
      required: true
    },
    completedLessons: {
      type: Number,
      required: true
    },
    totalAssignments: {
      type: Number,
      default: 0
    },
    completedAssignments: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  blockchainHash: {
    type: String,
    default: null // For future blockchain integration
  },
  sharedCount: {
    type: Number,
    default: 0
  },
  lastSharedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Method to generate certificate ID
certificateSchema.pre('save', function(next) {
  if (!this.certificateId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.certificateId = `CERT-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Method to determine grade based on score
certificateSchema.methods.calculateGrade = function(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// Virtual for checking if certificate is expired
certificateSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Index for better performance
certificateSchema.index({ user: 1, course: 1 });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ certificateHash: 1 });
certificateSchema.index({ status: 1, issuedDate: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);