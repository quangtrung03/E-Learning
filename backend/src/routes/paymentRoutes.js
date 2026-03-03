const express = require('express');
const { body } = require('express-validator');
const {
  createPaymentIntent,
  confirmPayment,
  getMyPayments,
  getPayment,
  handlePaymentWebhook,
  getAllPayments,
  refundPayment,
  markPaymentDisputed,
  fakePaymentSuccess,
  getPaymentByOrderId
} = require('../controllers/paymentController');
const { protect, requireAdmin } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: API quản lý thanh toán
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderId:
 *           type: string
 *         amount:
 *           type: object
 *           properties:
 *             original:
 *               type: number
 *             discount:
 *               type: number
 *             final:
 *               type: number
 *             currency:
 *               type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded]
 *         paymentMethod:
 *           type: object
 *         course:
 *           type: object
 *         user:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Validation rules
const createPaymentValidation = [
  body('courseId')
    .isMongoId()
    .withMessage('Course ID không hợp lệ'),
  body('paymentMethod.type')
    .isIn(['bank-transfer', 'vnpay', 'momo', 'zalopay', 'paypal'])
    .withMessage('Phương thức thanh toán không hợp lệ'),
  body('paymentMethod.provider')
    .isLength({ min: 1 })
    .withMessage('Provider thanh toán là bắt buộc'),
  body('billingAddress.fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên đầy đủ phải có từ 2-100 ký tự'),
  body('couponCode')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Mã coupon không được quá 20 ký tự')
];

const confirmPaymentValidation = [
  body('transactionRef')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Transaction reference không hợp lệ')
];

// Public routes
/**
 * @swagger
 * /payments/webhook/{provider}:
 *   post:
 *     summary: Webhook từ payment gateway
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vnpay, momo, zalopay]
 *         description: Payment provider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid signature
 */
router.post('/webhook/:provider', handlePaymentWebhook);

// Protected routes
router.use(protect);

/**
 * @swagger
 * /payments/create-intent:
 *   post:
 *     summary: Tạo payment intent
 *     tags: [Payments]
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
 *               - paymentMethod
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: ID khóa học
 *               couponCode:
 *                 type: string
 *                 description: Mã giảm giá (optional)
 *               paymentMethod:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [credit-card, debit-card, bank-transfer, momo, zalopay, vnpay, paypal]
 *                   provider:
 *                     type: string
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                     default: VN
 *     responses:
 *       201:
 *         description: Payment intent created successfully
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
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                     redirectUrl:
 *                       type: string
 *                     course:
 *                       type: object
 *       400:
 *         description: Invalid data hoặc đã đăng ký khóa học
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.post('/create-intent', protect, paymentLimiter, createPaymentValidation, createPaymentIntent);

/**
 * @swagger
 * /payments/{id}/confirm:
 *   put:
 *     summary: Xác nhận thanh toán
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentData:
 *                 type: object
 *                 description: Dữ liệu từ payment gateway
 *               transactionRef:
 *                 type: string
 *                 description: Reference từ gateway
 *               manualConfirm:
 *                 type: boolean
 *                 description: Xác nhận thủ công (admin only)
 *     responses:
 *       200:
 *         description: Thanh toán thành công
 *       400:
 *         description: Xác thực thanh toán thất bại
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy payment
 */
router.put('/:id/confirm', protect, paymentLimiter, confirmPaymentValidation, confirmPayment);

/**
 * @swagger
 * /payments/my-payments:
 *   get:
 *     summary: Lấy lịch sử thanh toán của user
 *     tags: [Payments]
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
 *           enum: [pending, processing, completed, failed, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 */
router.get('/my-payments', getMyPayments);

// Get payment by orderId (must be before '/:id' route)
router.get('/order/:orderId', getPaymentByOrderId);

// Fake payment success endpoint (for demo/testing)
router.post('/:orderId/fake-success', fakePaymentSuccess);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Lấy chi tiết payment
 *     tags: [Payments]
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
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy payment
 */
router.get('/:id', getPayment);

// Admin routes
router.use(requireAdmin);

/**
 * @swagger
 * /payments/admin/all:
 *   get:
 *     summary: Lấy tất cả payments (Admin)
 *     tags: [Payments]
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
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/admin/all', getAllPayments);

/**
 * @swagger
 * /payments/{id}/dispute:
 *   put:
 *     summary: Mark payment as disputed (Admin)
 *     tags: [Payments]
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
 *               reason:
 *                 type: string
 *                 description: Lý do tranh chấp
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Only completed payments can be disputed
 *       404:
 *         description: Payment not found
 */
router.put('/:id/dispute', [
  body('reason').optional().isLength({ min: 5, max: 500 }).withMessage('Lý do tranh chấp phải có từ 5-500 ký tự')
], markPaymentDisputed);

/**
 * @swagger
 * /payments/{id}/refund:
 *   put:
 *     summary: Refund payment (Admin)
 *     tags: [Payments]
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
 *                 description: Lý do refund
 *               refundAmount:
 *                 type: number
 *                 description: Số tiền refund (nếu khác với full amount)
 *     responses:
 *       200:
 *         description: Refund thành công
 *       400:
 *         description: Chỉ có thể refund payments đã hoàn thành
 *       404:
 *         description: Không tìm thấy payment
 */
router.put('/:id/refund', [
  body('reason').isLength({ min: 5, max: 500 }).withMessage('Lý do refund phải có từ 5-500 ký tự'),
  body('refundAmount').optional().isFloat({ min: 0 }).withMessage('Số tiền refund phải >= 0')
], refundPayment);

module.exports = router;