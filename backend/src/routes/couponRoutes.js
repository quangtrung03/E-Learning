const express = require('express');
const { body } = require('express-validator');
const {
  createCoupon,
  getAllCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponByCode,
  getPublicCoupons,
  getCouponAnalytics,
  toggleCouponStatus
} = require('../controllers/couponController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: API quản lý mã giảm giá
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [percentage, fixed-amount]
 *         value:
 *           type: number
 *         maxDiscountAmount:
 *           type: number
 *         minOrderAmount:
 *           type: number
 *         usageLimit:
 *           type: object
 *         currentUsage:
 *           type: object
 *         validity:
 *           type: object
 *         status:
 *           type: string
 *           enum: [active, inactive, expired, exhausted]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Validation rules
const createCouponValidation = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tên coupon phải có từ 3-100 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  body('type')
    .isIn(['percentage', 'fixed-amount'])
    .withMessage('Loại coupon phải là percentage hoặc fixed-amount'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Giá trị coupon phải >= 0'),
  body('maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Số tiền giảm tối đa phải >= 0'),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Đơn hàng tối thiểu phải >= 0'),
  body('validity.startDate')
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  body('validity.endDate')
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.validity.startDate)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),
  body('usageLimit.total')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Giới hạn tổng phải >= 1'),
  body('usageLimit.perUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Giới hạn mỗi user phải >= 1')
];

const updateCouponValidation = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tên coupon phải có từ 3-100 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  body('maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Số tiền giảm tối đa phải >= 0'),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Đơn hàng tối thiểu phải >= 0'),
  body('validity.startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  body('validity.endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ')
];

const validateCouponValidation = [
  body('code')
    .isLength({ min: 1, max: 20 })
    .withMessage('Mã coupon phải có từ 1-20 ký tự'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('Course ID không hợp lệ')
];

// Public routes
/**
 * @swagger
 * /coupons/public:
 *   get:
 *     summary: Lấy danh sách coupons công khai
 *     tags: [Coupons]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo category
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Lọc theo course
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/public', getPublicCoupons);

/**
 * @swagger
 * /coupons/by-code/{code}:
 *   get:
 *     summary: Lấy thông tin coupon theo mã
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã coupon
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy coupon
 */
router.get('/by-code/:code', getCouponByCode);

// Protected routes
router.use(protect);

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Validate mã coupon
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã coupon
 *               courseId:
 *                 type: string
 *                 description: ID khóa học (optional)
 *     responses:
 *       200:
 *         description: Mã coupon hợp lệ
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
 *                     coupon:
 *                       $ref: '#/components/schemas/Coupon'
 *                     discount:
 *                       type: object
 *                     course:
 *                       type: object
 *       400:
 *         description: Mã coupon không hợp lệ hoặc không thể sử dụng
 *       404:
 *         description: Không tìm thấy coupon
 */
router.post('/validate', validateCouponValidation, validateCoupon);

// Admin routes
router.use(requireAdmin);

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Tạo coupon mới (Admin)
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - value
 *               - validity
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã coupon (tự động tạo nếu không có)
 *               name:
 *                 type: string
 *                 description: Tên coupon
 *               description:
 *                 type: string
 *                 description: Mô tả coupon
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed-amount]
 *                 description: Loại giảm giá
 *               value:
 *                 type: number
 *                 description: Giá trị giảm (% hoặc số tiền)
 *               maxDiscountAmount:
 *                 type: number
 *                 description: Số tiền giảm tối đa (cho percentage)
 *               minOrderAmount:
 *                 type: number
 *                 description: Giá trị đơn hàng tối thiểu
 *               usageLimit:
 *                 type: object
 *                 properties:
 *                   total:
 *                     type: number
 *                   perUser:
 *                     type: number
 *               validity:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *               applicableFor:
 *                 type: object
 *                 properties:
 *                   courseIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: string
 *               restrictions:
 *                 type: object
 *     responses:
 *       201:
 *         description: Tạo coupon thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', createCouponValidation, createCoupon);

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Lấy danh sách tất cả coupons (Admin)
 *     tags: [Coupons]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, expired, exhausted]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [percentage, fixed-amount]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo code hoặc name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
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
 */
router.get('/', getAllCoupons);

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     summary: Lấy chi tiết coupon (Admin)
 *     tags: [Coupons]
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
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy coupon
 */
router.get('/:id', getCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     summary: Cập nhật coupon (Admin)
 *     tags: [Coupons]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               maxDiscountAmount:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *               usageLimit:
 *                 type: object
 *               validity:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Không thể cập nhật (đã được sử dụng)
 *       404:
 *         description: Không tìm thấy coupon
 */
router.put('/:id', updateCouponValidation, updateCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Xóa coupon (Admin)
 *     tags: [Coupons]
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
 *       400:
 *         description: Không thể xóa (đã được sử dụng)
 *       404:
 *         description: Không tìm thấy coupon
 */
router.delete('/:id', deleteCoupon);

/**
 * @swagger
 * /coupons/{id}/toggle-status:
 *   put:
 *     summary: Bật/tắt coupon (Admin)
 *     tags: [Coupons]
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
 *         description: Thay đổi trạng thái thành công
 *       404:
 *         description: Không tìm thấy coupon
 */
router.put('/:id/toggle-status', toggleCouponStatus);

/**
 * @swagger
 * /coupons/{id}/analytics:
 *   get:
 *     summary: Lấy thống kê sử dụng coupon (Admin)
 *     tags: [Coupons]
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
 *         description: Lấy thống kê thành công
 *       404:
 *         description: Không tìm thấy coupon
 */
router.get('/:id/analytics', getCouponAnalytics);

module.exports = router;