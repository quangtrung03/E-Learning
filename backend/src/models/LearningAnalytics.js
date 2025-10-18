const mongoose = require('mongoose');

const skillProgressSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const learningAnalyticsSchema = new mongoose.Schema({
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
  enrolledDate: {
    type: Date,
    required: true
  },
  lastAccessDate: {
    type: Date,
    default: Date.now
  },
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  averageSessionDuration: {
    type: Number, // in minutes
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  averageScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  progressData: {
    lessonsCompleted: {
      type: Number,
      default: 0
    },
    totalLessons: {
      type: Number,
      required: true
    },
    assignmentsCompleted: {
      type: Number,
      default: 0
    },
    totalAssignments: {
      type: Number,
      default: 0
    },
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    totalQuizzes: {
      type: Number,
      default: 0
    }
  },
  performanceMetrics: {
    streakDays: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    averageQuizScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    averageAssignmentScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    improvementRate: {
      type: Number,
      default: 0 // percentage improvement over time
    }
  },
  behaviorPatterns: {
    preferredStudyTime: [{
      hour: {
        type: Number,
        min: 0,
        max: 23
      },
      frequency: {
        type: Number,
        default: 0
      }
    }],
    averageSessionsPerWeek: {
      type: Number,
      default: 0
    },
    mostActiveDay: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: null
    },
    studyConsistency: {
      type: Number, // 0-100 score
      min: 0,
      max: 100,
      default: 0
    }
  },
  skillsProgress: [skillProgressSchema],
  weakAreas: [{
    topic: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    frequency: {
      type: Number,
      default: 1
    },
    lastEncountered: {
      type: Date,
      default: Date.now
    }
  }],
  strongAreas: [{
    topic: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    frequency: {
      type: Number,
      default: 1
    },
    lastEncountered: {
      type: Date,
      default: Date.now
    }
  }],
  recommendedCourses: [{
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course'
    },
    reason: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  learningPath: [{
    step: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      enum: ['lesson', 'assignment', 'quiz', 'project'],
      required: true
    },
    estimatedTime: {
      type: Number, // in minutes
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  }],
  predictions: {
    completionDate: {
      type: Date,
      default: null
    },
    finalGrade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      default: null
    },
    successProbability: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  engagementScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  motivationLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index
learningAnalyticsSchema.index({ user: 1, course: 1 }, { unique: true });

// Other indexes
learningAnalyticsSchema.index({ user: 1, lastAccessDate: -1 });
learningAnalyticsSchema.index({ course: 1, completionRate: -1 });
learningAnalyticsSchema.index({ engagementScore: -1 });

// Virtual for overall progress percentage
learningAnalyticsSchema.virtual('overallProgress').get(function() {
  const progress = this.progressData;
  const totalItems = progress.totalLessons + progress.totalAssignments + progress.totalQuizzes;
  const completedItems = progress.lessonsCompleted + progress.assignmentsCompleted + progress.quizzesCompleted;
  
  if (totalItems === 0) return 0;
  return Math.round((completedItems / totalItems) * 100);
});

// Method to update analytics
learningAnalyticsSchema.methods.updateAnalytics = function() {
  this.lastUpdated = new Date();
  this.lastAccessDate = new Date();
  return this.save();
};

module.exports = mongoose.model('LearningAnalytics', learningAnalyticsSchema);