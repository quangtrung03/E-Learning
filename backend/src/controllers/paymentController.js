const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const Course = require('../models/Course');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Enrollment = require('../models/Enrollment');
const crypto = require('crypto');
const axios = require('axios');
const { deleteEnrollment } = require('../utils/enrollmentHelpers');
const { sanitizeGatewayResponse } = require('../utils/paymentHelpers');

const PLATFORM_FEE_RATE = 0.25;

const applyPlatformFeeSnapshot = async (payment) => {
  if (!payment) return;
  if (payment.platformFeeRate != null && payment.platformFeeAmount != null && payment.instructorNetAmount != null) return;

  const gross = payment.amount?.final ?? 0;
  const platformFeeAmount = Math.round(gross * PLATFORM_FEE_RATE);
  const instructorNetAmount = Math.max(0, gross - platformFeeAmount);

  // Ensure course is populated enough to read instructor
  let instructorId = null;
  if (payment.course && typeof payment.course === 'object' && payment.course.instructor) {
    instructorId = payment.course.instructor._id || payment.course.instructor;
  }
  if (!instructorId && payment.course) {
    const courseId = typeof payment.course === 'object' ? payment.course._id : payment.course;
    if (courseId) {
      const courseDoc = await Course.findById(courseId).select('instructor');
      instructorId = courseDoc?.instructor || null;
    }
  }

  payment.platformFeeRate = PLATFORM_FEE_RATE;
  payment.platformFeeAmount = platformFeeAmount;
  payment.instructorNetAmount = instructorNetAmount;
  payment.instructorId = instructorId;

  await payment.save();
};

// @desc    Tạo payment intent (bước đầu thanh toán)
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { courseId, couponCode, paymentMethod, billingAddress } = req.body;

    const user = await User.findById(req.user.id).select('name email phone');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra khóa học
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    if (!course.isPublished || course.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Khóa học không khả dụng'
      });
    }

    // Kiểm tra user đã đăng ký chưa
    const isEnrolled = await Enrollment.isEnrolled(req.user.id, courseId);

    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký khóa học này rồi'
      });
    }

    // Tính toán giá
    let originalAmount = course.price;
    let discountAmount = 0;
    let finalAmount = originalAmount;
    let appliedCoupon = null;

    // Áp dụng coupon nếu có
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        status: 'active'
      });

      if (coupon && coupon.isValid) {
        const canUse = coupon.canUserUse(req.user.id, courseId);
        if (canUse.canUse) {
          discountAmount = coupon.calculateDiscount(originalAmount);
          finalAmount = Math.max(0, originalAmount - discountAmount);
          appliedCoupon = coupon;

          // Cập nhật analytics coupon
          coupon.analytics.attempts += 1;
          await coupon.save();
        } else {
          return res.status(400).json({
            success: false,
            message: canUse.reason
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn'
        });
      }
    }

    // Normalize payment method
    const normalizedPaymentMethod =
      typeof paymentMethod === 'string'
        ? { type: paymentMethod, provider: paymentMethod }
        : (paymentMethod || {});

    const paymentTypeRaw = normalizedPaymentMethod.type;
    const paymentType = paymentTypeRaw === 'manual' ? 'bank-transfer' : paymentTypeRaw;
    const paymentProvider = (normalizedPaymentMethod.provider || paymentType || 'bank-transfer').toLowerCase();

    // Ensure required billing address fields exist (schema requires fullName + email)
    const billingAddressFinal = {
      fullName: billingAddress?.fullName || user.name || 'Học viên',
      email: billingAddress?.email || user.email,
      phone: billingAddress?.phone || user.phone || null,
      address: billingAddress?.address || null,
      city: billingAddress?.city || null,
      state: billingAddress?.state || null,
      zipCode: billingAddress?.zipCode || null,
      country: billingAddress?.country || 'VN'
    };

    if (!billingAddressFinal.email) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu email để tạo thanh toán. Vui lòng cập nhật email trong hồ sơ.'
      });
    }

    // Tạo orderId unique
    const orderId = `ORD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Tạo payment record
    const payment = new Payment({
      user: req.user.id,
      course: courseId,
      orderId,
      amount: {
        original: originalAmount,
        discount: discountAmount,
        final: finalAmount,
        currency: 'VND'
      },
      paymentMethod: {
        type: paymentType,
        provider: paymentProvider
      },
      status: 'pending',
      transactionId,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discountApplied: appliedCoupon ? (discountAmount / originalAmount) * 100 : 0,
      billingAddress: billingAddressFinal,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        createdFrom: 'web'
      }
    });

    await payment.save();

    // TEMPORARY: Comment payment gateways for production stability
    let paymentGatewayResponse = {};
    let redirectUrl = null;

    switch (paymentProvider) {
      case 'fake':
      case 'demo':
        // Fake payment for demo - auto success
        paymentGatewayResponse = {
          status: 'success',
          message: 'Thanh toán demo thành công',
          redirectUrl: `${process.env.FRONTEND_URL}/payment/simulate?orderId=${encodeURIComponent(payment.orderId)}&provider=${encodeURIComponent(paymentProvider)}`
        };
        redirectUrl = paymentGatewayResponse.redirectUrl;
        break;
        
      case 'vnpay':
        // VNPay integration (disabled for now)
        paymentGatewayResponse = {
          status: 'pending',
          message: 'VNPay đang được phát triển',
          redirectUrl: `${process.env.FRONTEND_URL}/payment/simulate?orderId=${encodeURIComponent(payment.orderId)}&provider=${encodeURIComponent(paymentProvider)}`
        };
        redirectUrl = paymentGatewayResponse.redirectUrl;
        break;
        
      case 'momo':
        // MoMo integration (disabled for now)
        paymentGatewayResponse = {
          status: 'pending',
          message: 'MoMo đang được phát triển',
          redirectUrl: `${process.env.FRONTEND_URL}/payment/simulate?orderId=${encodeURIComponent(payment.orderId)}&provider=${encodeURIComponent(paymentProvider)}`
        };
        redirectUrl = paymentGatewayResponse.redirectUrl;
        break;

      case 'zalopay':
        paymentGatewayResponse = {
          status: 'pending',
          message: 'ZaloPay đang được phát triển',
          redirectUrl: `${process.env.FRONTEND_URL}/payment/simulate?orderId=${encodeURIComponent(payment.orderId)}&provider=${encodeURIComponent(paymentProvider)}`
        };
        redirectUrl = paymentGatewayResponse.redirectUrl;
        break;
        
      case 'bank-transfer':
      default:
        paymentGatewayResponse = {
          status: 'pending',
          message: 'Thanh toán offline - Vui lòng chuyển khoản theo thông tin bên dưới',
          bankInfo: {
            bank: process.env.BANK_NAME || 'Vietcombank',
            accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
            accountName: process.env.BANK_ACCOUNT_NAME || 'CONG TY E-LEARNING',
            transferNote: `EL${payment.orderId}`,
            qrCode: `${process.env.FRONTEND_URL}/payment/simulate?orderId=${encodeURIComponent(payment.orderId)}&provider=${encodeURIComponent(paymentProvider)}`
          }
        };
        redirectUrl = `${process.env.FRONTEND_URL}/payment/simulate?orderId=${encodeURIComponent(payment.orderId)}&provider=${encodeURIComponent(paymentProvider)}`;
        break;
    }

    // ✅ SECURITY FIX: Sanitize gateway response before saving
    payment.paymentGatewayResponse = sanitizeGatewayResponse(
      paymentGatewayResponse, 
      paymentProvider
    );
    await payment.save();

    // Demo/fake provider: auto-complete payment for testing
    if (paymentProvider === 'demo' || paymentProvider === 'fake') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.paymentGatewayResponse = {
        ...payment.paymentGatewayResponse,
        autoCompleted: true,
        completedAt: payment.completedAt
      };
      await payment.save();

      await applyPlatformFeeSnapshot(payment);

      const existingEnrollment = await Enrollment.findOne({
        user: payment.user,
        course: payment.course
      });

      if (!existingEnrollment) {
        try {
          await Enrollment.create({
            user: payment.user,
            course: payment.course,
            payment: payment._id,
            enrolledAt: new Date(),
            progress: 0,
            status: 'active'
          });
        } catch (e) {
          if (e?.code !== 11000) throw e;
        }
      }

      if (payment.couponCode) {
        const coupon = await Coupon.findOne({ code: payment.couponCode });
        if (coupon) {
          await coupon.useCoupon(payment.user, payment.amount.discount, payment.amount.final);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Đã tạo payment intent thành công',
      data: {
        payment: {
          id: payment._id,
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          couponApplied: appliedCoupon ? {
            code: appliedCoupon.code,
            discount: discountAmount
          } : null
        },
        redirectUrl,
        course: {
          id: course._id,
          title: course.title,
          price: course.price
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo payment intent',
      error: error.message
    });
  }
};

// @desc    Xác nhận thanh toán
// @route   PUT /api/payments/:id/confirm
// @access  Private
const confirmPayment = async (req, res) => {
  try {
    const { paymentData, transactionRef } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title instructor');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy payment'
      });
    }

    // Owner OR admin mới được thao tác
    if (payment.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập payment này'
      });
    }

    if (req.body.manualConfirm && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể xác nhận thủ công'
      });
    }

    if (payment.status === 'completed') {
      // Idempotent: ensure enrollment exists and return success
      let existingEnrollment = await Enrollment.findOne({
        user: payment.user._id,
        course: payment.course._id
      });

      if (!existingEnrollment) {
        try {
          existingEnrollment = await Enrollment.create({
            user: payment.user._id,
            course: payment.course._id,
            payment: payment._id,
            enrolledAt: new Date(),
            progress: 0,
            status: 'active'
          });
        } catch (e) {
          if (e?.code !== 11000) throw e;
          existingEnrollment = await Enrollment.findOne({
            user: payment.user._id,
            course: payment.course._id
          });
        }
      }

      await applyPlatformFeeSnapshot(payment);

      return res.status(200).json({
        success: true,
        message: 'Payment đã được xác nhận trước đó',
        data: {
          payment: {
            id: payment._id,
            orderId: payment.orderId,
            status: payment.status,
            completedAt: payment.completedAt,
            amount: payment.amount
          },
          course: payment.course
        }
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payment đã ở trạng thái ${payment.status}`
      });
    }

    // Verify payment with gateway
    let verificationResult = false;
    if (paymentData) {
      verificationResult = await verifyPaymentWithGateway(payment, paymentData);
    }

    if (verificationResult || req.body.manualConfirm) {
      // Cập nhật payment status
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.paymentGatewayResponse = {
        ...payment.paymentGatewayResponse,
        confirmation: paymentData,
        transactionRef,
        confirmedAt: new Date()
      };

      await payment.save();

      await applyPlatformFeeSnapshot(payment);

      // Enroll user vào course bằng Enrollment model
      const existingEnrollment = await Enrollment.findOne({
        user: payment.user._id,
        course: payment.course._id
      });

      if (!existingEnrollment) {
        try {
          await Enrollment.create({
            user: payment.user._id,
            course: payment.course._id,
            payment: payment._id,
            enrolledAt: new Date(),
            progress: 0,
            status: 'active'
          });
        } catch (e) {
          if (e?.code !== 11000) throw e;
        }
      }

      // Sử dụng coupon nếu có
      if (payment.couponCode) {
        const coupon = await Coupon.findOne({ code: payment.couponCode });
        if (coupon) {
          await coupon.useCoupon(
            payment.user._id, 
            payment.amount.discount, 
            payment.amount.final
          );
        }
      }

      res.status(200).json({
        success: true,
        message: 'Thanh toán thành công! Bạn đã được ghi danh vào khóa học.',
        data: {
          payment: {
            id: payment._id,
            orderId: payment.orderId,
            status: payment.status,
            completedAt: payment.completedAt,
            amount: payment.amount
          },
          course: payment.course
        }
      });

    } else {
      payment.status = 'failed';
      payment.paymentGatewayResponse = {
        ...payment.paymentGatewayResponse,
        error: 'Payment verification failed',
        failedAt: new Date()
      };
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'Xác thực thanh toán thất bại'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác nhận thanh toán',
      error: error.message
    });
  }
};

// @desc    Lấy lịch sử thanh toán của user
// @route   GET /api/payments/my-payments
// @access  Private
const getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('course', 'title thumbnail instructor')
      .populate('course.instructor', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        payments
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử thanh toán',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết một payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title description price instructor')
      .populate('course.instructor', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy payment'
      });
    }

    // Check quyền truy cập
    if (payment.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập payment này'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        payment
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin payment',
      error: error.message
    });
  }
};

// @desc    Webhook từ payment gateway
// @route   POST /api/payments/webhook/:provider
// @access  Public (nhưng cần verify signature)
const handlePaymentWebhook = async (req, res) => {
  try {
    const { provider } = req.params;
    const webhookData = req.body;

    // Verify webhook signature
    if (!verifyWebhookSignature(provider, webhookData, req.headers)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // TEMPORARY: Comment payment gateway webhooks for production stability
    let paymentUpdate = null;
    switch (provider) {
      // case 'vnpay':
      //   paymentUpdate = await processVNPayWebhook(webhookData);
      //   break;
      // case 'momo':
      //   paymentUpdate = await processMoMoWebhook(webhookData);
      //   break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Payment gateway webhooks temporarily disabled'
        });
    }

    if (paymentUpdate) {
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to process webhook'
      });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Admin: Lấy tất cả payments
// @route   GET /api/payments/admin/all
// @access  Private (Admin)
const getAllPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      provider, 
      dateFrom, 
      dateTo,
      search 
    } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (status) query.status = status;
    if (provider) query['paymentMethod.provider'] = provider;
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('course', 'title instructor')
      .populate('course.instructor', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    // Thống kê tổng quan
    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount.final' },
          totalDiscount: { $sum: '$amount.discount' },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalAmount: 0,
        totalDiscount: 0,
        completedPayments: 0,
        failedPayments: 0
      },
      data: {
        payments
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách payments',
      error: error.message
    });
  }
};

// @desc    Admin: Refund payment
// @route   PUT /api/payments/:id/refund
// @access  Private (Admin)
const refundPayment = async (req, res) => {
  try {
    const { reason, refundAmount } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate('user')
      .populate('course');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy payment'
      });
    }

    if (!['completed', 'disputed'].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể refund payments đã hoàn thành hoặc đang tranh chấp'
      });
    }

    const refundAmountFinal = refundAmount || payment.amount.final;

    // Process refund with payment gateway
    let refundResult = false;
    try {
      refundResult = await processRefundWithGateway(payment, refundAmountFinal);
    } catch (error) {
      console.error('Gateway refund error:', error);
    }

    // Cập nhật payment
    payment.status = 'refunded';
    payment.refund = {
      amount: refundAmountFinal,
      reason,
      refundedBy: req.user.id,
      refundedAt: new Date(),
      gatewayResult: refundResult
    };

    await payment.save();

    try {
      await AuditLog.create({
        actor: req.user.id,
        action: 'PAYMENT_REFUND',
        entityType: 'Payment',
        entityId: payment._id,
        details: {
          orderId: payment.orderId,
          courseId: payment.course,
          userId: payment.user,
          refundAmount: refundAmountFinal,
          reason: reason || null
        }
      });
    } catch (logError) {
      console.error('❌ Failed to create audit log (refundPayment):', logError.message);
    }

    // Remove enrollment using Enrollment model
    await deleteEnrollment(payment.user._id, payment.course._id);

    // Cập nhật course stats (không cần update students array nữa vì dùng virtual)
    await Course.findByIdAndUpdate(payment.course._id, {
      $inc: { 
        'stats.totalStudents': -1,
        'stats.totalRevenue': -refundAmountFinal
      }
    });

    res.status(200).json({
      success: true,
      message: 'Đã xử lý refund thành công',
      data: {
        payment
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý refund',
      error: error.message
    });
  }
};

// @desc    Admin: Mark payment as disputed
// @route   PUT /api/payments/:id/dispute
// @access  Private (Admin)
const markPaymentDisputed = async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy payment'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể đánh dấu tranh chấp với payments đã hoàn thành'
      });
    }

    payment.status = 'disputed';
    payment.timeline = Array.isArray(payment.timeline) ? payment.timeline : [];
    payment.timeline.push({
      status: 'disputed',
      message: reason || 'Payment bị đánh dấu tranh chấp',
      timestamp: new Date(),
      data: { actor: req.user.id }
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu payment là tranh chấp',
      data: { payment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái tranh chấp',
      error: error.message
    });
  }
};

// Helper functions for payment gateway integration
async function createVNPayPayment(payment) {
  // VNPay integration logic
  return {
    redirectUrl: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${payment.transactionId}`,
    status: 'pending'
  };
}

async function createMoMoPayment(payment) {
  // MoMo integration logic
  return {
    payUrl: `https://test-payment.momo.vn/pay/${payment.transactionId}`,
    status: 'pending'
  };
}

async function verifyPaymentWithGateway(payment, paymentData) {
  // Verify payment với gateway tương ứng
  return true; // Mock verification
}

/**
 * Verify webhook signature from payment providers
 * @param {String} provider - Payment provider name
 * @param {Object} data - Webhook data
 * @param {Object} headers - Request headers
 * @returns {Boolean} - Whether signature is valid
 */
function verifyWebhookSignature(provider, data, headers) {
  try {
    switch (provider) {
      case 'stripe':
        return verifyStripeWebhook(data, headers);
      
      case 'vnpay':
        return verifyVNPayWebhook(data);
      
      case 'momo':
        return verifyMoMoWebhook(data);
      
      default:
        console.error(`Unknown payment provider: ${provider}`);
        return false;
    }
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Verify Stripe webhook signature
 */
function verifyStripeWebhook(data, headers) {
  const signature = headers['stripe-signature'];
  if (!signature) {
    console.error('Missing Stripe signature header');
    return false;
  }

  try {
    // Stripe webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return false;
    }

    // Stripe library will verify signature (if using stripe.webhooks.constructEvent)
    // For manual verification:
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
      JSON.stringify(data), 
      signature, 
      webhookSecret
    );
    
    return true;
  } catch (error) {
    console.error('Stripe webhook verification failed:', error.message);
    return false;
  }
}

/**
 * Verify VNPay webhook signature
 */
function verifyVNPayWebhook(data) {
  try {
    const vnpSecureHash = data.vnp_SecureHash;
    if (!vnpSecureHash) {
      console.error('Missing VNPay secure hash');
      return false;
    }

    // VNPay hash secret from environment
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    if (!hashSecret) {
      console.error('VNPAY_HASH_SECRET not configured');
      return false;
    }

    // Create hash data string (exclude vnp_SecureHash)
    const dataObj = { ...data };
    delete dataObj.vnp_SecureHash;
    delete dataObj.vnp_SecureHashType;

    // Sort keys alphabetically
    const sortedKeys = Object.keys(dataObj).sort();
    const hashData = sortedKeys
      .map(key => `${key}=${dataObj[key]}`)
      .join('&');

    // Create HMAC SHA512 hash
    const calculatedHash = crypto
      .createHmac('sha512', hashSecret)
      .update(Buffer.from(hashData, 'utf-8'))
      .digest('hex');

    // Compare hashes
    const isValid = calculatedHash === vnpSecureHash;
    if (!isValid) {
      console.error('VNPay hash mismatch');
    }
    
    return isValid;
  } catch (error) {
    console.error('VNPay webhook verification failed:', error.message);
    return false;
  }
}

/**
 * Verify MoMo webhook signature
 */
function verifyMoMoWebhook(data) {
  try {
    const signature = data.signature;
    if (!signature) {
      console.error('Missing MoMo signature');
      return false;
    }

    // MoMo secret key from environment
    const secretKey = process.env.MOMO_SECRET_KEY;
    if (!secretKey) {
      console.error('MOMO_SECRET_KEY not configured');
      return false;
    }

    // Create signature string according to MoMo docs
    const rawSignature = `accessKey=${data.accessKey}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;

    // Create HMAC SHA256 signature
    const calculatedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // Compare signatures
    const isValid = calculatedSignature === signature;
    if (!isValid) {
      console.error('MoMo signature mismatch');
    }
    
    return isValid;
  } catch (error) {
    console.error('MoMo webhook verification failed:', error.message);
    return false;
  }
}

async function processVNPayWebhook(webhookData) {
  // Process VNPay webhook
  return true;
}

async function processMoMoWebhook(webhookData) {
  // Process MoMo webhook
  return true;
}

async function processRefundWithGateway(payment, amount) {
  // Process refund với gateway
  return { success: true, refundId: `REF_${Date.now()}` };
}

// @desc    Fake payment success (for demo/testing)
// @route   POST /api/payments/:orderId/fake-success
// @access  Private
const fakePaymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId })
      .populate('user', 'name email')
      .populate('course', 'title price instructor');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy payment'
      });
    }

    // Verify user owns this payment
    if (payment.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập payment này'
      });
    }

    // Check if already completed
    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment đã được thanh toán rồi'
      });
    }

    // Update payment to completed
    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.paymentGatewayResponse = {
      ...payment.paymentGatewayResponse,
      fakeSuccess: true,
      completedAt: payment.completedAt,
      message: 'Demo payment - auto completed'
    };
    await payment.save();

    await applyPlatformFeeSnapshot(payment);

    // Check if already enrolled using Enrollment model
    const existingEnrollment = await Enrollment.findOne({
      user: payment.user._id,
      course: payment.course._id
    });

    if (!existingEnrollment) {
      // Enroll user vào course using Enrollment model (single source of truth)
      await Enrollment.create({
        user: payment.user._id,
        course: payment.course._id,
        payment: payment._id,
        enrolledAt: new Date(),
        progress: 0,
        status: 'active'
      });
      
      console.log(`✅ Enrollment created for user ${payment.user._id} - Course ${payment.course._id}`);
    } else {
      console.log(`⚠️ User ${payment.user._id} already enrolled in course ${payment.course._id}`);
    }

    // Use coupon if exists
    if (payment.couponCode) {
      const coupon = await Coupon.findOne({ code: payment.couponCode });
      if (coupon) {
        await coupon.useCoupon(
          payment.user._id,
          payment.amount.discount,
          payment.amount.final
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Thanh toán thành công! Bạn đã được ghi danh vào khóa học.',
      data: {
        payment: {
          id: payment._id,
          orderId: payment.orderId,
          status: payment.status,
          completedAt: payment.completedAt,
          amount: payment.amount
        },
        course: {
          id: payment.course._id,
          title: payment.course.title,
          instructor: payment.course.instructor
        }
      }
    });

  } catch (error) {
    console.error('Fake payment success error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý thanh toán',
      error: error.message
    });
  }
};

// @desc    Get payment by orderId (for payment status check)
// @route   GET /api/payments/order/:orderId
// @access  Private
const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId })
      .populate('user', 'name email')
      .populate('course', 'title price thumbnail instructor');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy payment'
      });
    }

    // Verify user owns this payment (admin can access all)
    if (payment.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập payment này'
      });
    }

    res.status(200).json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin payment',
      error: error.message
    });
  }
};

module.exports = {
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
};