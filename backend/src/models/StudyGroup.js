const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxLength: [200, 'Tiêu đề lịch học không được quá 200 ký tự']
  },
  description: {
    type: String,
    maxLength: [500, 'Mô tả lịch học không được quá 500 ký tự']
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15
  },
  topic: {
    type: String,
    required: true,
    maxLength: [200, 'Chủ đề không được quá 200 ký tự']
  },
  meetingUrl: {
    type: String,
    default: null
  },
  meetingPassword: {
    type: String,
    default: null
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'google-meet', 'teams', 'discord', 'other'],
    default: 'zoom'
  },
  attendees: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not-going'],
      default: 'going'
    },
    joinedAt: {
      type: Date,
      default: null
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  recordingUrl: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxLength: [100, 'Tên nhóm học không được quá 100 ký tự']
  },
  description: {
    type: String,
    required: true,
    maxLength: [500, 'Mô tả nhóm học không được quá 500 ký tự']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    contributions: {
      type: Number,
      default: 0
    }
  }],
  moderators: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  maxMembers: {
    type: Number,
    default: 50,
    min: 2,
    max: 100
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  requireApproval: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [{
    type: String,
    maxLength: [30, 'Tag không được quá 30 ký tự']
  }],
  studyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
    default: 'mixed'
  },
  language: {
    type: String,
    default: 'vi'
  },
  timezone: {
    type: String,
    default: 'Asia/Ho_Chi_Minh'
  },
  schedule: [scheduleSchema],
  rules: [{
    type: String,
    maxLength: [200, 'Quy tắc không được quá 200 ký tự']
  }],
  resources: [{
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'image', 'other'],
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    totalStudyHours: {
      type: Number,
      default: 0
    },
    averageAttendance: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate invite code before saving
studyGroupSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  next();
});

// Virtual for getting member count
studyGroupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// Virtual for getting active sessions count
studyGroupSchema.virtual('activeSessionsCount').get(function() {
  return this.schedule.filter(session => 
    session.status === 'scheduled' && session.date > new Date()
  ).length;
});

// Method to check if user is member
studyGroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.isActive
  );
};

// Method to check if user is moderator
studyGroupSchema.methods.isModerator = function(userId) {
  return this.moderators.some(moderator => 
    moderator.toString() === userId.toString()
  ) || this.creator.toString() === userId.toString();
};

// Index for better performance
studyGroupSchema.index({ course: 1, isActive: 1 });
studyGroupSchema.index({ creator: 1 });
studyGroupSchema.index({ 'members.user': 1 });
studyGroupSchema.index({ inviteCode: 1 });
studyGroupSchema.index({ isPrivate: 1, requireApproval: 1 });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);