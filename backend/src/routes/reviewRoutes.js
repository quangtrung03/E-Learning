const express = require('express');
const { body } = require('express-validator');
const {
  createReview,
  getReviewsByCourse,
  getUserReviews,
  getReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getReviewStats,
  reportReview,
  moderateReview
} = require('../controllers/reviewController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: API quản lý đánh giá khóa học
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user:
 *           type: object
 *         course:
 *           type: object
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         title:
 *           type: string
 *         comment:
 *           type: string
 *         helpful:
 *           type: array
 *           items:
 *             type: string
 *         reports:
 *           type: array
 *         isModerated:
 *           type: boolean
 *         moderatedBy:
 *           type: string
 *         moderationReason:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, hidden, deleted]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Validation rules
const createReviewValidation = [
  body('courseId')
    .isMongoId()
    .withMessage('Course ID không hợp lệ'),
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating phải từ 1-5'),
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Tiêu đề phải có từ 5-100 ký tự'),
  body('comment')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Bình luận phải có từ 10-1000 ký tự')
];

const updateReviewValidation = [
  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating phải từ 1-5'),
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Tiêu đề phải có từ 5-100 ký tự'),
  body('comment')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Bình luận phải có từ 10-1000 ký tự')
];

const reportReviewValidation = [
  body('reason')
    .isIn(['spam', 'inappropriate', 'offensive', 'fake', 'other'])
    .withMessage('Reason không hợp lệ'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không quá 500 ký tự')
];

const moderateReviewValidation = [
  body('action')
    .isIn(['approve', 'hide', 'delete'])
    .withMessage('Action không hợp lệ'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Lý do không quá 200 ký tự')
];

// Protected routes
router.use(protect);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Tạo đánh giá mới
 *     tags: [Reviews]
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
 *               - rating
 *               - comment
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: ID khóa học
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Điểm đánh giá từ 1-5
 *               title:
 *                 type: string
 *                 description: Tiêu đề đánh giá
 *               comment:
 *                 type: string
 *                 description: Nội dung đánh giá
 *     responses:
 *       201:
 *         description: Tạo đánh giá thành công
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
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Đã đánh giá khóa học này rồi
 *       403:
 *         description: Chưa hoàn thành khóa học
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.post('/', createReviewValidation, createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Lấy chi tiết đánh giá
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.get('/:id', getReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Cập nhật đánh giá
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền chỉnh sửa
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.put('/:id', updateReviewValidation, updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Xóa đánh giá
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: Không có quyền xóa
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.delete('/:id', deleteReview);

/**
 * @swagger
 * /reviews/{id}/helpful:
 *   post:
 *     summary: Đánh dấu đánh giá hữu ích/không hữu ích
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.post('/:id/helpful', markReviewHelpful);

/**
 * @swagger
 * /reviews/{id}/report:
 *   post:
 *     summary: Báo cáo đánh giá vi phạm
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [spam, inappropriate, offensive, fake, other]
 *                 description: Lý do báo cáo
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết
 *     responses:
 *       200:
 *         description: Báo cáo thành công
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.post('/:id/report', reportReviewValidation, reportReview);

/**
 * @swagger
 * /users/{userId}/reviews:
 *   get:
 *     summary: Lấy đánh giá của user
 *     tags: [Reviews]
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       404:
 *         description: Không tìm thấy user
 */
router.get('/users/:userId/reviews', getUserReviews);

// Course-specific review routes
/**
 * @swagger
 * /courses/{courseId}/reviews:
 *   get:
 *     summary: Lấy đánh giá theo khóa học
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter theo rating
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, helpful]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.get('/course/:courseId', getReviewsByCourse);

/**
 * @swagger
 * /courses/{courseId}/reviews/stats:
 *   get:
 *     summary: Lấy thống kê đánh giá của khóa học
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
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
 *                     totalReviews:
 *                       type: number
 *                     averageRating:
 *                       type: number
 *                     ratingDistribution:
 *                       type: object
 *                       properties:
 *                         1:
 *                           type: number
 *                         2:
 *                           type: number
 *                         3:
 *                           type: number
 *                         4:
 *                           type: number
 *                         5:
 *                           type: number
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.get('/course/:courseId/stats', getReviewStats);

// Admin routes
/**
 * @swagger
 * /admin/reviews/{id}/moderate:
 *   put:
 *     summary: Kiểm duyệt đánh giá (Admin)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, hide, delete]
 *                 description: Hành động kiểm duyệt
 *               reason:
 *                 type: string
 *                 description: Lý do kiểm duyệt
 *     responses:
 *       200:
 *         description: Kiểm duyệt thành công
 *       403:
 *         description: Không có quyền admin
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.put('/admin/reviews/:id/moderate', requireAdmin, moderateReviewValidation, moderateReview);

module.exports = router;