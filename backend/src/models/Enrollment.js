const mongoose = require('mongoose');

/**
 * Enrollment Model - Centralized enrollment tracking
 * Giải quyết vấn đề duplicate data giữa User.enrolledCourses và Course.students
 * Single source of truth cho tất cả enrollment data
 */

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Enrollment phải có user']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Enrollment phải có course']
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  // Bài học gần nhất đã truy cập (để resume đa thiết bị)
  lastLesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson',
    default: null
  },
  lastLessonAccessedAt: {
    type: Date,
    default: null
  },
  // Theo dõi lessons đã hoàn thành
  completedLessons: [{
    lesson: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lesson'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Theo dõi assignments đã submit
  submittedAssignments: [{
    assignment: {
      type: mongoose.Schema.ObjectId,
      ref: 'Assignment'
    },
    submission: {
      type: mongoose.Schema.ObjectId,
      ref: 'Submission'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    grade: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  // Thời gian học tập
  totalTimeSpent: {
    type: Number, // Tính bằng phút
    default: 0
  },
  // Certificate nếu hoàn thành
  certificate: {
    type: mongoose.Schema.ObjectId,
    ref: 'Certificate',
    default: null
  },
  // Payment reference
  payment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Payment',
    default: null
  },
  // Notes của học viên
  notes: {
    type: String,
    maxLength: [1000, 'Ghi chú không được quá 1000 ký tự']
  }
}, {
  timestamps: true
});

// Indexes để query nhanh
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true }); // Mỗi user chỉ enroll 1 lần/course
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ user: 1, status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });

// Method: Đánh dấu lesson đã hoàn thành
enrollmentSchema.methods.completeLesson = async function(lessonId) {
  // Kiểm tra đã complete chưa
  const alreadyCompleted = this.completedLessons.some(
    cl => cl.lesson.toString() === lessonId.toString()
  );
  
  if (!alreadyCompleted) {
    this.completedLessons.push({
      lesson: lessonId,
      completedAt: new Date()
    });
    
    // Cập nhật progress
    await this.updateProgress();
    await this.save();
  }
  
  return this;
};

// Method: Bỏ đánh dấu lesson đã hoàn thành
enrollmentSchema.methods.uncompleteLesson = async function(lessonId) {
  this.completedLessons = this.completedLessons.filter(
    cl => cl.lesson.toString() !== lessonId.toString()
  );
  
  // Cập nhật progress
  await this.updateProgress();
  await this.save();
  
  return this;
};

// Method: Cập nhật progress dựa trên lessons đã hoàn thành
enrollmentSchema.methods.updateProgress = async function() {
  const Course = require('./Course');
  const course = await Course.findById(this.course).select('lessons');
  
  if (!course || !course.lessons || course.lessons.length === 0) {
    this.progress = 0;
    return this;
  }
  
  const totalLessons = course.lessons.length;
  const courseLessonIds = new Set((course.lessons || []).map((l) => l.toString()));
  const completedCount = (this.completedLessons || []).filter((cl) => courseLessonIds.has(cl.lesson.toString())).length;
  
  this.progress = Math.round((completedCount / totalLessons) * 100);

  // Clamp để tránh dữ liệu lệch do lesson bị xoá
  this.progress = Math.min(100, Math.max(0, this.progress));
  
  // Nếu hoàn thành 100% -> đánh dấu completed
  if (this.progress === 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this;
};

// Method: Cập nhật bài học gần nhất đã truy cập
enrollmentSchema.methods.setLastLesson = async function(lessonId) {
  this.lastLesson = lessonId;
  this.lastLessonAccessedAt = new Date();
  this.lastAccessedAt = new Date();
  await this.save();
  return this;
};

// Method: Update thời gian học
enrollmentSchema.methods.addTimeSpent = async function(minutes) {
  this.totalTimeSpent += minutes;
  this.lastAccessedAt = new Date();
  await this.save();
  return this;
};

// Method: Submit assignment
enrollmentSchema.methods.submitAssignment = async function(assignmentId, submissionId, grade = null) {
  // Kiểm tra đã submit chưa
  const existingSubmission = this.submittedAssignments.find(
    sa => sa.assignment.toString() === assignmentId.toString()
  );
  
  if (existingSubmission) {
    // Update submission hiện tại
    existingSubmission.submission = submissionId;
    existingSubmission.submittedAt = new Date();
    if (grade !== null) {
      existingSubmission.grade = grade;
    }
  } else {
    // Thêm submission mới
    this.submittedAssignments.push({
      assignment: assignmentId,
      submission: submissionId,
      submittedAt: new Date(),
      grade: grade
    });
  }
  
  await this.save();
  return this;
};

// Static method: Lấy enrollment của user cho course
enrollmentSchema.statics.getEnrollment = async function(userId, courseId) {
  return await this.findOne({ user: userId, course: courseId });
};

// Static method: Kiểm tra user đã enroll chưa
enrollmentSchema.statics.isEnrolled = async function(userId, courseId) {
  const enrollment = await this.findOne({ user: userId, course: courseId });
  return !!enrollment;
};

// Static method: Lấy tất cả enrollments của user
enrollmentSchema.statics.getUserEnrollments = async function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return await this.find(query)
    .populate('course')
    .sort({ enrolledAt: -1 });
};

// Static method: Lấy tất cả enrollments của course
enrollmentSchema.statics.getCourseEnrollments = async function(courseId, options = {}) {
  const query = { course: courseId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return await this.find(query)
    .populate('user', 'name email avatar')
    .sort({ enrolledAt: -1 });
};

// Virtual: completion rate
enrollmentSchema.virtual('completionRate').get(function() {
  return this.progress;
});

// Middleware: Update lastAccessedAt khi query
enrollmentSchema.pre('save', function(next) {
  if (this.isModified('completedLessons') || this.isModified('totalTimeSpent')) {
    this.lastAccessedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
