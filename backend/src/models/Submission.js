const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  selectedOptions: [{
    type: Number // Index of selected option
  }],
  textAnswer: {
    type: String,
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
});

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  answers: [answerSchema],
  startedAt: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date,
    default: null
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'graded', 'late'],
    default: 'in-progress'
  },
  passed: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    default: null
  },
  gradedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  },
  isLate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for getting percentage score
submissionSchema.virtual('percentage').get(function() {
  if (this.totalPoints === 0) return 0;
  return Math.round((this.pointsEarned / this.totalPoints) * 100);
});

// Index for better performance
submissionSchema.index({ assignment: 1, student: 1, attemptNumber: 1 });
submissionSchema.index({ student: 1, submittedAt: -1 });
submissionSchema.index({ assignment: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);