const express = require('express');
const { body } = require('express-validator');
const {
  createDiscussion,
  getDiscussionsByCourse,
  getDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  toggleLikeDiscussion,
  toggleLikeReply,
  togglePinDiscussion,
  getDiscussionStats
} = require('../controllers/discussionController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Discussions
 *   description: API quản lý thảo luận
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Discussion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         author:
 *           type: object
 *         course:
 *           type: object
 *         category:
 *           type: string
 *           enum: [general, question, announcement, resource]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         replies:
 *           type: array
 *         likes:
 *           type: array
 *         views:
 *           type: number
 *         isPinned:
 *           type: boolean
 *         status:
 *           type: string
 *           enum: [active, closed, deleted]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Validation rules
const createDiscussionValidation = [
  body('courseId')
    .isMongoId()
    .withMessage('Course ID không hợp lệ'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự')
    .escape(), // XSS prevention
  body('content')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Nội dung phải có từ 10-5000 ký tự')
    .escape(), // XSS prevention
  body('category')
    .optional()
    .isIn(['general', 'question', 'announcement', 'resource'])
    .withMessage('Category không hợp lệ'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Tối đa 5 tags'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tag không được quá 30 ký tự')
    .escape() // XSS prevention
];

const updateDiscussionValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự')
    .escape(),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Nội dung phải có từ 10-5000 ký tự')
    .escape(),
  body('category')
    .optional()
    .isIn(['general', 'question', 'announcement', 'resource'])
    .withMessage('Category không hợp lệ'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Tối đa 5 tags'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tag không được quá 30 ký tự')
    .escape()
];

const addReplyValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Nội dung reply phải có từ 1-2000 ký tự')
    .escape(),
  body('parentReply')
    .optional()
    .isMongoId()
    .withMessage('Parent reply ID không hợp lệ')
];

// Protected routes
router.use(protect);

/**
 * @swagger
 * /discussions:
 *   post:
 *     summary: Tạo thảo luận mới
 *     tags: [Discussions]
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
 *               - title
 *               - content
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: ID khóa học
 *               title:
 *                 type: string
 *                 description: Tiêu đề thảo luận
 *               content:
 *                 type: string
 *                 description: Nội dung thảo luận
 *               category:
 *                 type: string
 *                 enum: [general, question, announcement, resource]
 *                 default: general
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: Tạo thảo luận thành công
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
 *                     discussion:
 *                       $ref: '#/components/schemas/Discussion'
 *       403:
 *         description: Chưa đăng ký khóa học
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.post('/', createDiscussionValidation, createDiscussion);

/**
 * @swagger
 * /discussions/{id}:
 *   get:
 *     summary: Lấy chi tiết thảo luận
 *     tags: [Discussions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discussion ID
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       403:
 *         description: Không có quyền xem
 *       404:
 *         description: Không tìm thấy thảo luận
 */
router.get('/:id', getDiscussion);

/**
 * @swagger
 * /discussions/{id}:
 *   put:
 *     summary: Cập nhật thảo luận
 *     tags: [Discussions]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền chỉnh sửa
 *       404:
 *         description: Không tìm thấy thảo luận
 */
router.put('/:id', updateDiscussionValidation, updateDiscussion);

/**
 * @swagger
 * /discussions/{id}:
 *   delete:
 *     summary: Xóa thảo luận
 *     tags: [Discussions]
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
 *         description: Không tìm thấy thảo luận
 */
router.delete('/:id', deleteDiscussion);

/**
 * @swagger
 * /discussions/{id}/replies:
 *   post:
 *     summary: Thêm reply vào thảo luận
 *     tags: [Discussions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discussion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nội dung reply
 *               parentReply:
 *                 type: string
 *                 description: ID của reply cha (để tạo nested reply)
 *     responses:
 *       201:
 *         description: Thêm reply thành công
 *       403:
 *         description: Không có quyền reply
 *       404:
 *         description: Không tìm thấy thảo luận
 */
router.post('/:id/replies', addReplyValidation, addReply);

/**
 * @swagger
 * /discussions/{id}/like:
 *   post:
 *     summary: Like/Unlike thảo luận
 *     tags: [Discussions]
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
 *         description: Like/Unlike thành công
 *       404:
 *         description: Không tìm thấy thảo luận
 */
router.post('/:id/like', toggleLikeDiscussion);

/**
 * @swagger
 * /discussions/{id}/replies/{replyId}/like:
 *   post:
 *     summary: Like/Unlike reply
 *     tags: [Discussions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discussion ID
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reply ID
 *     responses:
 *       200:
 *         description: Like/Unlike reply thành công
 *       404:
 *         description: Không tìm thấy thảo luận hoặc reply
 */
router.post('/:id/replies/:replyId/like', toggleLikeReply);

/**
 * @swagger
 * /discussions/{id}/pin:
 *   put:
 *     summary: Pin/Unpin thảo luận (Admin hoặc Instructor)
 *     tags: [Discussions]
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
 *         description: Pin/Unpin thành công
 *       403:
 *         description: Không có quyền pin
 *       404:
 *         description: Không tìm thấy thảo luận
 */
router.put('/:id/pin', togglePinDiscussion);

// Course-specific discussion routes
/**
 * @swagger
 * /discussions/course/{courseId}:
 *   get:
 *     summary: Lấy thảo luận theo khóa học
 *     tags: [Discussions]
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, question, announcement, resource]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, likes, views, replies]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tiêu đề hoặc nội dung
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       403:
 *         description: Không có quyền xem thảo luận của khóa học
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.get('/course/:courseId', getDiscussionsByCourse);

/**
 * @swagger
 * /discussions/course/{courseId}/stats:
 *   get:
 *     summary: Lấy thống kê thảo luận của khóa học (Instructor hoặc Admin)
 *     tags: [Discussions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *       403:
 *         description: Không có quyền xem thống kê
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.get('/course/:courseId/stats', getDiscussionStats);

module.exports = router;