const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const crypto = require('crypto');
const axios = require('axios');

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
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === courseId
    );

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
          finalAmount = originalAmount - discountAmount;
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
        type: paymentMethod.type,
        provider: paymentMethod.provider || 'manual'
      },
      status: 'pending',
      transactionId,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discountApplied: appliedCoupon ? (discountAmount / originalAmount) * 100 : 0,
      billingAddress,
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

    switch (paymentMethod.provider) {
      // case 'vnpay':
      //   paymentGatewayResponse = await createVNPayPayment(payment);
      //   redirectUrl = paymentGatewayResponse.redirectUrl;
      //   break;
      // case 'momo':
      //   paymentGatewayResponse = await createMoMoPayment(payment);
      //   redirectUrl = paymentGatewayResponse.payUrl;
      //   break;
      case 'manual':
      case 'bank-transfer':
      default:
        paymentGatewayResponse = {
          status: 'pending',
          message: 'Thanh toán offline - Vui lòng chuyển khoản theo thông tin bên dưới',
          bankInfo: {
            bank: 'Vietcombank',
            accountNumber: '1234567890',
            accountName: 'CONG TY E-LEARNING',
            transferNote: `EL${payment.orderId}`,
            qrCode: `${process.env.FRONTEND_URL}/payment/qr/${payment.orderId}`
          }
        };
        break;
    }

    payment.paymentGatewayResponse = paymentGatewayResponse;
    await payment.save();

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

    if (payment.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập payment này'
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
      payment.paidAt = new Date();
      payment.paymentGatewayResponse = {
        ...payment.paymentGatewayResponse,
        confirmation: paymentData,
        transactionRef,
        confirmedAt: new Date()
      };

      await payment.save();

      // Enroll user vào course
      await User.findByIdAndUpdate(payment.user._id, {
        $addToSet: {
          enrolledCourses: {
            course: payment.course._id,
            enrolledAt: new Date(),
            progress: 0,
            status: 'active'
          }
        }
      });

      // Cập nhật course students
      await Course.findByIdAndUpdate(payment.course._id, {
        $addToSet: { students: payment.user._id },
        $inc: { 
          'stats.totalStudents': 1,
          'stats.totalRevenue': payment.amount.final
        }
      });

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
            paidAt: payment.paidAt,
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

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể refund payments đã hoàn thành'
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

    // Remove user từ course
    await User.findByIdAndUpdate(payment.user._id, {
      $pull: {
        enrolledCourses: { course: payment.course._id }
      }
    });

    // Cập nhật course stats
    await Course.findByIdAndUpdate(payment.course._id, {
      $pull: { students: payment.user._id },
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

function verifyWebhookSignature(provider, data, headers) {
  // Verify webhook signature
  return true; // Mock verification
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

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getMyPayments,
  getPayment,
  handlePaymentWebhook,
  getAllPayments,
  refundPayment
};