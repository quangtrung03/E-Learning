const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  verifyResetToken
} = require('../controllers/authController');

const {
  requestAdminRole,
  validateAdminToken,
  submitAdminRequest
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API xác thực người dùng
 */

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Họ tên phải có từ 2-50 ký tự'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Vui lòng nhập email hợp lệ'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Vui lòng nhập email hợp lệ'),
  body('password')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Vui lòng nhập email hợp lệ')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token là bắt buộc'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
];

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "123456"
 *               role:
 *                 type: string
 *                 enum: [student, teacher, admin]
 *                 default: student
 *                 example: "student"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email đã tồn tại
 */
router.post('/register', registerValidation, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Thông tin đăng nhập không hợp lệ
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post('/login', loginValidation, login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa xác thực
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Cập nhật thông tin cá nhân
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nguyễn Văn B"
 *               phone:
 *                 type: string
 *                 example: "0123456789"
 *               bio:
 *                 type: string
 *                 example: "Lập trình viên"
 *               avatar:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.put('/update-profile', protect, uploadImage.single('avatar'), updateProfile);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Xác thực email bằng token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "a1b2c3d4e5f6789012345678901234567890abcd"
 *     responses:
 *       200:
 *         description: Xác thực thành công
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.post('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Gửi lại email xác thực
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Email xác thực đã được gửi lại
 *       400:
 *         description: Email đã được xác thực hoặc không tồn tại
 */
router.post('/resend-verification', resendVerification);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Quên mật khẩu - Gửi email đặt lại mật khẩu
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Email đặt lại mật khẩu đã được gửi
 *       400:
 *         description: Email không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-token/{token}:
 *   get:
 *     summary: Xác thực token đặt lại mật khẩu
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token đặt lại mật khẩu
 *     responses:
 *       200:
 *         description: Token hợp lệ
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.get('/verify-reset-token/:token', verifyResetToken);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu với token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "abc123def456ghi789"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại thành công
 *       400:
 *         description: Token không hợp lệ hoặc mật khẩu không đủ mạnh
 *       500:
 *         description: Lỗi server
 */
router.post('/reset-password', resetPasswordValidation, resetPassword);

// ====================== ADMIN REQUEST ROUTES ======================

/**
 * @swagger
 * /auth/admin/request:
 *   post:
 *     summary: Gửi yêu cầu trở thành admin (Bước 1)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Đã gửi link xác thực đến email
 *       400:
 *         description: Đã là admin hoặc có yêu cầu pending
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/admin/request', protect, requestAdminRole);

/**
 * @swagger
 * /auth/admin/validate/{token}:
 *   get:
 *     summary: Xác thực token và lấy thông tin request (Bước 2)
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Validation token
 *     responses:
 *       200:
 *         description: Token hợp lệ, có thể điền form
 *       400:
 *         description: Token không hợp lệ hoặc hết hạn
 *       404:
 *         description: Token không tồn tại
 */
router.get('/admin/validate/:token', validateAdminToken);

/**
 * @swagger
 * /auth/admin/submit-request:
 *   post:
 *     summary: Gửi thông tin chi tiết admin request (Bước 3)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - fullName
 *               - citizenId
 *               - dateOfBirth
 *               - phone
 *               - address
 *               - reason
 *             properties:
 *               token:
 *                 type: string
 *                 description: Validation token
 *               fullName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Họ tên đầy đủ
 *               citizenId:
 *                 type: string
 *                 minLength: 9
 *                 maxLength: 12
 *                 description: Số CCCD
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Ngày sinh
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{10,11}$'
 *                 description: Số điện thoại
 *               address:
 *                 type: string
 *                 maxLength: 200
 *                 description: Địa chỉ
 *               occupation:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nghề nghiệp
 *               experience:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Kinh nghiệm
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Lý do muốn làm admin
 *     responses:
 *       200:
 *         description: Gửi yêu cầu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc token hết hạn
 */
const submitAdminRequestValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token là bắt buộc'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Họ tên là bắt buộc')
    .isLength({ max: 100 })
    .withMessage('Họ tên không được quá 100 ký tự'),
  body('citizenId')
    .trim()
    .notEmpty()
    .withMessage('Số CCCD là bắt buộc')
    .isLength({ min: 9, max: 12 })
    .withMessage('Số CCCD phải có từ 9-12 ký tự')
    .matches(/^[0-9]+$/)
    .withMessage('Số CCCD chỉ được chứa số'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Ngày sinh là bắt buộc')
    .isISO8601()
    .withMessage('Ngày sinh không hợp lệ'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại phải có 10-11 số'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ là bắt buộc')
    .isLength({ max: 200 })
    .withMessage('Địa chỉ không được quá 200 ký tự'),
  body('occupation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Nghề nghiệp không được quá 100 ký tự'),
  body('experience')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Kinh nghiệm không được quá 1000 ký tự'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Lý do muốn làm admin là bắt buộc')
    .isLength({ max: 500 })
    .withMessage('Lý do không được quá 500 ký tự')
];

router.post('/admin/submit-request', submitAdminRequestValidation, submitAdminRequest);

module.exports = router;
