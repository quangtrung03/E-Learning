const Enrollment = require('../models/Enrollment');

/**
 * Helper functions for Enrollment model
 * Thay thế cho User.enrolledCourses và Course.students
 */

/**
 * Check if user is enrolled in a course
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @returns {Promise<Boolean>}
 */
const isUserEnrolled = async (userId, courseId) => {
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId,
    status: { $in: ['active', 'completed'] }
  });
  return !!enrollment;
};

/**
 * Get user's enrollment for a specific course
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @returns {Promise<Object|null>}
 */
const getUserEnrollment = async (userId, courseId) => {
  return await Enrollment.findOne({
    user: userId,
    course: courseId
  });
};

/**
 * Get all enrolled courses for a user
 * @param {String} userId - User ID
 * @param {Object} options - Query options (populate, select, limit, etc.)
 * @returns {Promise<Array>}
 */
const getUserEnrollments = async (userId, options = {}) => {
  const {
    populate = 'course',
    select = null,
    limit = null,
    skip = 0,
    sort = { enrolledAt: -1 },
    status = ['active', 'completed']
  } = options;

  let query = Enrollment.find({
    user: userId,
    status: { $in: status }
  });

  if (populate) {
    query = query.populate(populate);
  }

  if (select) {
    query = query.select(select);
  }

  if (sort) {
    query = query.sort(sort);
  }

  if (skip) {
    query = query.skip(skip);
  }

  if (limit) {
    query = query.limit(limit);
  }

  return await query.exec();
};

/**
 * Get total enrolled courses count for a user
 * @param {String} userId - User ID
 * @returns {Promise<Number>}
 */
const getUserEnrollmentCount = async (userId) => {
  return await Enrollment.countDocuments({
    user: userId,
    status: { $in: ['active', 'completed'] }
  });
};

/**
 * Get all enrolled course IDs for a user (for quick lookups)
 * @param {String} userId - User ID
 * @returns {Promise<Array<String>>}
 */
const getUserEnrolledCourseIds = async (userId) => {
  const enrollments = await Enrollment.find({
    user: userId,
    status: { $in: ['active', 'completed'] }
  }).select('course').lean();

  return enrollments.map(e => e.course.toString());
};

/**
 * Get enrollment with progress details
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @returns {Promise<Object|null>}
 */
const getEnrollmentProgress = async (userId, courseId) => {
  return await Enrollment.findOne({
    user: userId,
    course: courseId
  })
  .populate('course', 'title')
  .populate('completedLessons.lesson', 'title')
  .lean();
};

/**
 * Update enrollment progress
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @param {Number} progress - Progress percentage (0-100)
 * @returns {Promise<Object>}
 */
const updateEnrollmentProgress = async (userId, courseId, progress) => {
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  enrollment.progress = Math.min(100, Math.max(0, progress));
  enrollment.lastAccessedAt = new Date();

  if (enrollment.progress >= 100 && !enrollment.completedAt) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
  }

  await enrollment.save();
  return enrollment;
};

/**
 * Mark lesson as completed in enrollment
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @param {String} lessonId - Lesson ID
 * @returns {Promise<Object>}
 */
const markLessonCompleted = async (userId, courseId, lessonId) => {
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Check if lesson already completed
  const alreadyCompleted = enrollment.completedLessons.some(
    cl => cl.lesson.toString() === lessonId.toString()
  );

  if (!alreadyCompleted) {
    enrollment.completedLessons.push({
      lesson: lessonId,
      completedAt: new Date()
    });
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();
  }

  return enrollment;
};

/**
 * Unmark lesson as completed
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @param {String} lessonId - Lesson ID
 * @returns {Promise<Object>}
 */
const unmarkLessonCompleted = async (userId, courseId, lessonId) => {
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  enrollment.completedLessons = enrollment.completedLessons.filter(
    cl => cl.lesson.toString() !== lessonId.toString()
  );
  enrollment.lastAccessedAt = new Date();
  await enrollment.save();

  return enrollment;
};

/**
 * Get all students enrolled in a course
 * @param {String} courseId - Course ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
const getCourseEnrollments = async (courseId, options = {}) => {
  const {
    populate = 'user',
    select = null,
    limit = null,
    skip = 0,
    sort = { enrolledAt: -1 },
    status = ['active', 'completed']
  } = options;

  let query = Enrollment.find({
    course: courseId,
    status: { $in: status }
  });

  if (populate) {
    query = query.populate(populate);
  }

  if (select) {
    query = query.select(select);
  }

  if (sort) {
    query = query.sort(sort);
  }

  if (skip) {
    query = query.skip(skip);
  }

  if (limit) {
    query = query.limit(limit);
  }

  return await query.exec();
};

/**
 * Get total students count for a course
 * @param {String} courseId - Course ID
 * @returns {Promise<Number>}
 */
const getCourseEnrollmentCount = async (courseId) => {
  return await Enrollment.countDocuments({
    course: courseId,
    status: { $in: ['active', 'completed'] }
  });
};

module.exports = {
  isUserEnrolled,
  getUserEnrollment,
  getUserEnrollments,
  getUserEnrollmentCount,
  getUserEnrolledCourseIds,
  getEnrollmentProgress,
  updateEnrollmentProgress,
  markLessonCompleted,
  unmarkLessonCompleted,
  getCourseEnrollments,
  getCourseEnrollmentCount
};
