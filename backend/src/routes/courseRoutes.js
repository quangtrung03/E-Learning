const express = require('express');
const { body } = require('express-validator');
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  submitCourseForApproval,
  getMyCourses,
  getMyEnrolledCourses
} = require('../controllers/courseController');
const { protect, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: API quản lý khóa học
 */

// Validation rules
const courseValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Mô tả phải có từ 20-1000 ký tự'),
  body('category')
    .isIn(['programming', 'design', 'business', 'marketing', 'language', 'science', 'other'])
    .withMessage('Danh mục không hợp lệ'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Cấp độ không hợp lệ'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Giá phải là số không âm'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Thời lượng phải là số nguyên dương'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Giảm giá phải từ 0-100%')
];

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Lấy danh sách tất cả khóa học
 *     tags: [Courses]
 *     security: []
 *     parameters:
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
 *           default: 10
 *         description: Số khóa học mỗi trang
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Lọc theo cấp độ
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tiêu đề
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
 *                   example: 50
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 */
router.get('/', getAllCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một khóa học
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
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
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.get('/:id', getCourse);

// Private routes
router.use(protect); // Tất cả routes dưới đây cần authentication

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Tạo khóa học mới (Authenticated User)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - price
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Khóa học React cơ bản"
 *               description:
 *                 type: string
 *                 example: "Học React từ cơ bản đến nâng cao"
 *               category:
 *                 type: string
 *                 enum: [programming, design, business, marketing, language, science, other]
 *                 example: "programming"
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: "beginner"
 *               price:
 *                 type: number
 *                 example: 299000
 *               duration:
 *                 type: number
 *                 example: 120
 *               thumbnail:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Biết HTML/CSS cơ bản", "Có máy tính"]
 *               whatYouWillLearn:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Tạo ứng dụng React", "Hiểu về Component"]
 *     responses:
 *       201:
 *         description: Tạo khóa học thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/', protect, courseValidation, createCourse);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Cập nhật khóa học (Course Owner/Admin)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy khóa học
 *   delete:
 *     summary: Xóa khóa học (Course Owner/Admin)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.put('/:id', protect, updateCourse);
router.delete('/:id', protect, deleteCourse);

/**
 * @swagger
 * /courses/{id}/enroll:
 *   post:
 *     summary: Đăng ký học khóa học
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 *       400:
 *         description: Đã đăng ký khóa học này
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.post('/:id/enroll', enrollCourse);

/**
 * @swagger
 * /courses/{id}/submit:
 *   put:
 *     summary: Gửi khóa học để admin duyệt
 *     tags: [Courses]
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
 *         description: Gửi duyệt thành công
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.put('/:id/submit', protect, submitCourseForApproval);

/**
 * @swagger
 * /courses/my-courses:
 *   get:
 *     summary: Lấy khóa học của tôi
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
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
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/my-courses', protect, getMyCourses);

/**
 * @swagger
 * /courses/my-enrolled-courses:
 *   get:
 *     summary: Lấy khóa học đã đăng ký
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/my-enrolled-courses', protect, getMyEnrolledCourses);

module.exports = router;
