const express = require('express');
const { body } = require('express-validator');
const {
  getPendingCourses,
  approveCourse,
  rejectCourse,
  getAdminStats,
  toggleUserBan,
  getAllUsers,
  getAllCourses,
  getAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getCourseDetail,
  getUserDetail,
  makeUserAdmin
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: API quản trị hệ thống
 */

// Tất cả routes admin đều cần authentication và admin permission
router.use(protect);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Lấy thống kê tổng quan hệ thống
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không phải admin
 */
router.get('/stats', getAdminStats);

/**
 * @swagger
 * /admin/courses/pending:
 *   get:
 *     summary: Lấy danh sách khóa học chờ duyệt
 *     tags: [Admin]
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
router.get('/courses/pending', getPendingCourses);
router.get('/courses/all', getAllCourses);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-ban', toggleUserBan);

/**
 * @swagger
 * /admin/courses/{id}/approve:
 *   put:
 *     summary: Duyệt khóa học
 *     tags: [Admin]
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
 *         description: Duyệt thành công
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.put('/courses/:id/approve', approveCourse);

/**
 * @swagger
 * /admin/courses/{id}/reject:
 *   put:
 *     summary: Từ chối khóa học
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 description: Lý do từ chối
 *                 example: "Nội dung không phù hợp với chính sách"
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
router.put('/courses/:id/reject', [
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Lý do từ chối phải có từ 1-500 ký tự')
], rejectCourse);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng
 *     tags: [Admin]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, banned]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /admin/users/{id}/toggle-ban:
 *   put:
 *     summary: Khóa/Mở khóa tài khoản người dùng
 *     tags: [Admin]
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
 *         description: Cập nhật thành công
 *       403:
 *         description: Không thể khóa admin khác
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put('/users/:id/toggle-ban', toggleUserBan);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Lấy chi tiết người dùng
 *     tags: [Admin]
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
 *         description: Lấy chi tiết thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/users/:id', getUserDetail);

/**
 * @swagger
 * /admin/users/{id}/make-admin:
 *   put:
 *     summary: Cấp quyền admin cho người dùng
 *     tags: [Admin]
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
 *         description: Cấp quyền thành công
 *       400:
 *         description: Người dùng đã là admin
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put('/users/:id/make-admin', makeUserAdmin);

/**
 * @swagger
 * /admin/courses/{id}:
 *   get:
 *     summary: Lấy chi tiết khóa học
 *     tags: [Admin]
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
 *         description: Lấy chi tiết thành công
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.get('/courses/:id', getCourseDetail);

// Admin Request routes
router.get('/admin-requests', getAdminRequests);
router.put('/admin-requests/:id/approve', approveAdminRequest);
router.put('/admin-requests/:id/reject', [
  body('reason').optional().isLength({ max: 500 }).withMessage('Lý do không được quá 500 ký tự')
], rejectAdminRequest);

module.exports = router;
