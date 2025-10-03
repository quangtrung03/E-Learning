const express = require('express');
const { body } = require('express-validator');
const {
  getLessonsByCourse,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  completeLesson,
  uncompleteLesson
} = require('../controllers/lessonController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: API quản lý bài học
 */

// Validation rules cho lesson
const lessonValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Nội dung bài học phải có ít nhất 10 ký tự'),
  body('contentType')
    .optional()
    .isIn(['text', 'video', 'pdf', 'quiz'])
    .withMessage('Loại nội dung không hợp lệ'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Thời lượng phải là số nguyên dương'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Thứ tự phải là số nguyên dương'),
  body('isPreview')
    .optional()
    .isBoolean()
    .withMessage('isPreview phải là boolean'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('URL video không hợp lệ')
];

/**
 * @swagger
 * /courses/{courseId}/lessons:
 *   get:
 *     summary: Lấy danh sách bài học của khóa học
 *     tags: [Lessons]
 *     security: []
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
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số bài học mỗi trang
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Lesson'
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.get('/courses/:courseId/lessons', getLessonsByCourse);

/**
 * @swagger
 * /lessons/{id}:
 *   get:
 *     summary: Lấy chi tiết bài học
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     lesson:
 *                       $ref: '#/components/schemas/Lesson'
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy bài học
 */
router.get('/lessons/:id', protect, getLesson);

// Protected routes - cần authentication
router.use(protect);

/**
 * @swagger
 * /courses/{courseId}/lessons:
 *   post:
 *     summary: Tạo bài học mới (Instructor/Admin)
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Giới thiệu về React"
 *               description:
 *                 type: string
 *                 example: "Tìm hiểu cơ bản về React framework"
 *               content:
 *                 type: string
 *                 example: "React là một thư viện JavaScript..."
 *               contentType:
 *                 type: string
 *                 enum: [text, video, pdf, quiz]
 *                 example: "text"
 *               videoUrl:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=..."
 *               duration:
 *                 type: number
 *                 example: 30
 *               order:
 *                 type: number
 *                 example: 1
 *               isPreview:
 *                 type: boolean
 *                 example: true
 *               resources:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [pdf, doc, image, link, other]
 *     responses:
 *       201:
 *         description: Tạo bài học thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.post('/courses/:courseId/lessons', lessonValidation, createLesson);

/**
 * @swagger
 * /lessons/{id}:
 *   put:
 *     summary: Cập nhật bài học (Instructor/Admin)
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [text, video, pdf, quiz]
 *               videoUrl:
 *                 type: string
 *               duration:
 *                 type: number
 *               order:
 *                 type: number
 *               isPreview:
 *                 type: boolean
 *               resources:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy bài học
 *   delete:
 *     summary: Xóa bài học (Instructor/Admin)
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy bài học
 */
router.put('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);

/**
 * @swagger
 * /lessons/{id}/complete:
 *   post:
 *     summary: Đánh dấu bài học đã hoàn thành
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Hoàn thành bài học thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đã hoàn thành bài học"
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       type: number
 *                       example: 75
 *                     completedLessons:
 *                       type: number
 *                       example: 3
 *                     totalLessons:
 *                       type: number
 *                       example: 4
 *       400:
 *         description: Đã hoàn thành bài học này rồi
 *       403:
 *         description: Chưa đăng ký khóa học
 *       404:
 *         description: Không tìm thấy bài học
 *   delete:
 *     summary: Hủy hoàn thành bài học
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Hủy hoàn thành thành công
 *       403:
 *         description: Chưa đăng ký khóa học
 *       404:
 *         description: Không tìm thấy bài học
 */
router.post('/lessons/:id/complete', completeLesson);
router.delete('/lessons/:id/complete', uncompleteLesson);

module.exports = router;