const crypto = require('crypto');
const Course = require('../models/Course');
const Payment = require('../models/Payment');

/**
 * Middleware xác thực webhook từ payment gateway
 */
const verifyPaymentWebhook = (provider) => {
  return (req, res, next) => {
    const signature = req.headers['x-signature'] || req.headers['signature'];
    
    if (!signature) {
      return res.status(401).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    try {
      let isValid = false;
      const payload = JSON.stringify(req.body);

      switch (provider) {
        // case 'vnpay':
        //   // TEMPORARY: VNPay disabled for production stability
        //   const vnpaySecret = process.env.VNPAY_HASH_SECRET;
        //   const vnpaySignature = crypto
        //     .createHmac('sha256', vnpaySecret)
        //     .update(payload)
        //     .digest('hex');
        //   isValid = crypto.timingSafeEqual(
        //     Buffer.from(signature, 'hex'),
        //     Buffer.from(vnpaySignature, 'hex')
        //   );
        //   break;

        // case 'momo':
        //   // TEMPORARY: MoMo disabled for production stability
        //   const momoSecret = process.env.MOMO_SECRET_KEY;
        //   const momoSignature = crypto
        //     .createHmac('sha256', momoSecret)
        //     .update(payload)
        //     .digest('hex');
        //   isValid = signature === momoSignature;
        //   break;

        // case 'stripe':
        //   // TEMPORARY: Stripe disabled for production stability
        //   const stripeSignature = req.headers['stripe-signature'];
        //   const stripeEndpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        //   
        //   try {
        //     const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        //     const event = stripe.webhooks.constructEvent(
        //       payload,
        //       stripeSignature,
        //       stripeEndpointSecret
        //     );
        //     req.stripeEvent = event;
        //     isValid = true;
        //   } catch (err) {
        //     console.error('Stripe webhook signature verification failed:', err.message);
        //     isValid = false;
        //   }
        //   break;

        default:
          // TEMPORARY: Allow all providers, just skip validation for now
          isValid = true;
          break;
      }

      if (!isValid) {
        console.error('❌ Payment webhook signature verification failed');
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      console.log('✅ Payment webhook signature verified');
      req.paymentProvider = provider;
      next();

    } catch (error) {
      console.error('❌ Error verifying payment webhook:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying webhook'
      });
    }
  };
};

/**
 * Middleware kiểm tra quyền mua khóa học
 */
const checkPurchasePermission = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Kiểm tra khóa học có tồn tại và available
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Khóa học chưa được công bố'
      });
    }

    // Kiểm tra đã mua khóa học chưa
    const existingPayment = await Payment.findOne({
      user: userId,
      course: courseId,
      status: 'completed'
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã mua khóa học này rồi'
      });
    }

    // Kiểm tra đã enrolled miễn phí chưa (nếu khóa học free)
    if (course.price === 0 && course.students.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký khóa học miễn phí này rồi'
      });
    }

    req.course = course;
    next();

  } catch (error) {
    console.error('❌ Error checking purchase permission:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền mua khóa học'
    });
  }
};

/**
 * Middleware kiểm tra payment đang pending
 */
const checkPendingPayment = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Kiểm tra có payment pending không (trong vòng 15 phút)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const pendingPayment = await Payment.findOne({
      user: userId,
      course: courseId,
      status: 'pending',
      createdAt: { $gte: fifteenMinutesAgo }
    });

    if (pendingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Bạn có một thanh toán đang chờ xử lý cho khóa học này',
        paymentId: pendingPayment._id
      });
    }

    next();

  } catch (error) {
    console.error('❌ Error checking pending payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra thanh toán đang chờ'
    });
  }
};

/**
 * Middleware validate payment amount
 */
const validatePaymentAmount = async (req, res, next) => {
  try {
    const { courseId, couponCode, amount } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    let expectedAmount = course.price;
    let discountAmount = 0;

    // Áp dụng coupon nếu có
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() }
      });

      if (coupon) {
        // Kiểm tra usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return res.status(400).json({
            success: false,
            message: 'Mã giảm giá đã hết lượt sử dụng'
          });
        }

        // Kiểm tra áp dụng cho khóa học này
        if (coupon.applicableCourses.length > 0 && 
            !coupon.applicableCourses.includes(courseId)) {
          return res.status(400).json({
            success: false,
            message: 'Mã giảm giá không áp dụng cho khóa học này'
          });
        }

        // Tính discount
        if (coupon.discountType === 'percentage') {
          discountAmount = (expectedAmount * coupon.discountValue) / 100;
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount || discountAmount);
        } else {
          discountAmount = Math.min(coupon.discountValue, expectedAmount);
        }

        expectedAmount -= discountAmount;
      }
    }

    // So sánh với amount từ client
    if (Math.abs(expectedAmount - amount) > 1) { // Tolerance 1 VND
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không chính xác',
        expectedAmount,
        receivedAmount: amount
      });
    }

    req.paymentDetails = {
      originalAmount: course.price,
      discountAmount,
      finalAmount: expectedAmount,
      couponCode
    };

    next();

  } catch (error) {
    console.error('❌ Error validating payment amount:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực số tiền thanh toán'
    });
  }
};

/**
 * Middleware rate limiting cho payment
 */
const paymentRateLimit = (req, res, next) => {
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 phút
  const maxAttempts = 3;

  // Sử dụng memory cache hoặc Redis trong production
  if (!global.paymentAttempts) {
    global.paymentAttempts = new Map();
  }

  const userAttempts = global.paymentAttempts.get(userId) || { count: 0, resetTime: now + windowMs };

  if (now > userAttempts.resetTime) {
    // Reset counter
    userAttempts.count = 1;
    userAttempts.resetTime = now + windowMs;
  } else {
    userAttempts.count++;
  }

  global.paymentAttempts.set(userId, userAttempts);

  if (userAttempts.count > maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Quá nhiều lần thử thanh toán. Vui lòng thử lại sau 5 phút.',
      retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
    });
  }

  next();
};

/**
 * Middleware log payment activity
 */
const logPaymentActivity = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log payment activity
      const logData = {
        action,
        userId: req.user?.id,
        courseId: req.body?.courseId || req.params?.courseId,
        amount: req.body?.amount || req.paymentDetails?.finalAmount,
        provider: req.body?.provider || req.paymentProvider,
        success: res.statusCode >= 200 && res.statusCode < 300,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      console.log('💰 Payment Activity:', JSON.stringify(logData, null, 2));

      // Trong production, có thể lưu vào database hoặc external logging service
      if (process.env.NODE_ENV === 'production') {
        // Save to analytics or audit log
        // await savePaymentLog(logData);
      }

      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  verifyPaymentWebhook,
  checkPurchasePermission,
  checkPendingPayment,
  validatePaymentAmount,
  paymentRateLimit,
  logPaymentActivity
};