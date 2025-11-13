const express = require('express');
const { body } = require('express-validator');
const {
  getUserAnalytics,
  getCourseAnalytics,
  getInstructorAnalytics,
  updateProgress,
  trackActivity,
  getRecommendations,
  generateReport,
  getDashboardStats,
  getEngagementMetrics,
  getLearningPath,
  exportAnalytics,
  getRevenueAnalytics
} = require('../controllers/analyticsController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: API phân tích học tập và thống kê
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LearningAnalytics:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user:
 *           type: object
 *         course:
 *           type: object
 *         progress:
 *           type: object
 *         timeSpent:
 *           type: number
 *         activities:
 *           type: array
 *         achievements:
 *           type: array
 *         lastAccessedAt:
 *           type: string
 *           format: date-time
 */

// Validation rules
const updateProgressValidation = [
  body('courseId')
    .isMongoId()
    .withMessage('Course ID không hợp lệ'),
  body('lessonId')
    .optional()
    .isMongoId()
    .withMessage('Lesson ID không hợp lệ'),
  body('progress')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress phải từ 0-100'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent phải >= 0'),
  body('activityType')
    .isIn(['lesson', 'assignment', 'quiz', 'discussion', 'video'])
    .withMessage('Activity type không hợp lệ')
];

const trackActivityValidation = [
  body('activityType')
    .isIn(['login', 'course_access', 'lesson_complete', 'assignment_submit', 'quiz_attempt', 'discussion_post', 'video_watch', 'resource_download'])
    .withMessage('Activity type không hợp lệ'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('Course ID không hợp lệ'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata phải là object')
];

const generateReportValidation = [
  body('type')
    .isIn(['user', 'course', 'instructor', 'system'])
    .withMessage('Report type không hợp lệ'),
  body('period')
    .isIn(['week', 'month', 'quarter', 'year', 'custom'])
    .withMessage('Period không hợp lệ'),
  body('startDate')
    .if(body('period').equals('custom'))
    .isISO8601()
    .withMessage('Start date phải là định dạng ISO 8601'),
  body('endDate')
    .if(body('period').equals('custom'))
    .isISO8601()
    .withMessage('End date phải là định dạng ISO 8601'),
  body('format')
    .optional()
    .isIn(['json', 'csv', 'pdf'])
    .withMessage('Format không hợp lệ')
];

// Protected routes
router.use(protect);

/**
 * @swagger
 * /analytics/user/{userId}:
 *   get:
 *     summary: Lấy phân tích học tập của user
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (dùng 'me' cho user hiện tại)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter theo khóa học cụ thể
 *     responses:
 *       200:
 *         description: Lấy phân tích thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTimeSpent:
 *                       type: number
 *                     coursesEnrolled:
 *                       type: number
 *                     coursesCompleted:
 *                       type: number
 *                     averageProgress:
 *                       type: number
 *                     activities:
 *                       type: array
 *                     achievements:
 *                       type: array
 *                     learningStreak:
 *                       type: number
 *       403:
 *         description: Không có quyền xem analytics
 */
router.get('/user/:userId', getUserAnalytics);

/**
 * @swagger
 * /analytics/course/{courseId}:
 *   get:
 *     summary: Lấy phân tích khóa học
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Lấy phân tích thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEnrollments:
 *                       type: number
 *                     activeStudents:
 *                       type: number
 *                     completionRate:
 *                       type: number
 *                     averageRating:
 *                       type: number
 *                     engagementMetrics:
 *                       type: object
 *                     progressDistribution:
 *                       type: object
 *       403:
 *         description: Không có quyền xem analytics khóa học
 */
router.get('/course/:courseId', getCourseAnalytics);

/**
 * @swagger
 * /analytics/instructor/{instructorId}:
 *   get:
 *     summary: Lấy phân tích của instructor
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Instructor ID (dùng 'me' cho instructor hiện tại)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Lấy phân tích thành công
 *       403:
 *         description: Không có quyền xem analytics instructor
 */
router.get('/instructor/:instructorId', getInstructorAnalytics);

/**
 * @swagger
 * /analytics/progress:
 *   post:
 *     summary: Cập nhật tiến độ học tập
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - progress
 *               - activityType
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: ID khóa học
 *               lessonId:
 *                 type: string
 *                 description: ID bài học (optional)
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Tiến độ hoàn thành (%)
 *               timeSpent:
 *                 type: number
 *                 description: Thời gian học (giây)
 *               activityType:
 *                 type: string
 *                 enum: [lesson, assignment, quiz, discussion, video]
 *                 description: Loại hoạt động
 *     responses:
 *       200:
 *         description: Cập nhật tiến độ thành công
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.post('/progress', updateProgressValidation, updateProgress);

/**
 * @swagger
 * /analytics/activity:
 *   post:
 *     summary: Theo dõi hoạt động học tập
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activityType
 *             properties:
 *               activityType:
 *                 type: string
 *                 enum: [login, course_access, lesson_complete, assignment_submit, quiz_attempt, discussion_post, video_watch, resource_download]
 *               courseId:
 *                 type: string
 *               metadata:
 *                 type: object
 *                 description: Thông tin bổ sung về hoạt động
 *     responses:
 *       200:
 *         description: Theo dõi hoạt động thành công
 */
router.post('/activity', trackActivityValidation, trackActivity);

/**
 * @swagger
 * /analytics/recommendations/{userId}:
 *   get:
 *     summary: Lấy gợi ý học tập
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (dùng 'me' cho user hiện tại)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [courses, lessons, resources, study_groups]
 *           default: courses
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Lấy gợi ý thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendations:
 *                       type: array
 *                     reasons:
 *                       type: array
 */
router.get('/recommendations/:userId', getRecommendations);

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Lấy thống kê dashboard
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: week
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin]
 *         description: Dashboard theo role (auto-detect nếu không có)
 *     responses:
 *       200:
 *         description: Lấy thống kê dashboard thành công
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /analytics/engagement:
 *   get:
 *     summary: Lấy metrics tương tác
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter theo khóa học
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter]
 *           default: month
 *     responses:
 *       200:
 *         description: Lấy engagement metrics thành công
 */
router.get('/engagement', getEngagementMetrics);

/**
 * @swagger
 * /analytics/learning-path/{userId}:
 *   get:
 *     summary: Lấy lộ trình học tập được gợi ý
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (dùng 'me' cho user hiện tại)
 *       - in: query
 *         name: goal
 *         schema:
 *           type: string
 *         description: Mục tiêu học tập
 *     responses:
 *       200:
 *         description: Lấy lộ trình thành công
 */
router.get('/learning-path/:userId', getLearningPath);

/**
 * @swagger
 * /analytics/reports:
 *   post:
 *     summary: Tạo báo cáo phân tích
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - period
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [user, course, instructor, system]
 *                 description: Loại báo cáo
 *               period:
 *                 type: string
 *                 enum: [week, month, quarter, year, custom]
 *                 description: Khoảng thời gian
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày bắt đầu (cho custom period)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày kết thúc (cho custom period)
 *               format:
 *                 type: string
 *                 enum: [json, csv, pdf]
 *                 default: json
 *                 description: Định dạng xuất
 *               filters:
 *                 type: object
 *                 description: Bộ lọc bổ sung
 *     responses:
 *       200:
 *         description: Tạo báo cáo thành công
 *       403:
 *         description: Không có quyền tạo báo cáo
 */
router.post('/reports', generateReportValidation, generateReport);

/**
 * @swagger
 * /analytics/export:
 *   get:
 *     summary: Xuất dữ liệu analytics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user_progress, course_analytics, engagement_data]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel, json]
 *           default: csv
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Xuất dữ liệu thành công
 *       403:
 *         description: Không có quyền xuất dữ liệu
 */
router.get('/export', exportAnalytics);

// Revenue analytics (Admin & Teachers only)
router.get('/revenue', protect, getRevenueAnalytics);

module.exports = router;