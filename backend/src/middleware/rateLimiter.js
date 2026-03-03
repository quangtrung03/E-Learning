const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter (đã có sẵn trong server.js)
 * 100 requests/15 minutes trong production
 * 1000 requests/15 minutes trong development
 */

/**
 * Strict rate limiter cho authentication endpoints
 * Ngăn chặn brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit 5 requests per window per IP
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 [${req.requestId}] Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút',
      requestId: req.requestId,
      retryAfter: 900 // seconds
    });
  }
});

/**
 * Rate limiter cho registration
 * Ngăn spam registration
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 registrations per hour per IP
  message: {
    success: false,
    message: 'Quá nhiều tài khoản đăng ký từ IP này. Vui lòng thử lại sau 1 giờ'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 [${req.requestId}] Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều tài khoản đăng ký. Vui lòng thử lại sau 1 giờ',
      requestId: req.requestId,
      retryAfter: 3600
    });
  }
});

/**
 * Rate limiter cho file upload
 * Ngăn spam upload
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // 20 uploads per hour in production
  message: {
    success: false,
    message: 'Quá nhiều file upload. Vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 [${req.requestId}] Upload rate limit exceeded for IP: ${req.ip}, User: ${req.user?.email}`);
    res.status(429).json({
      success: false,
      message: 'Bạn đã upload quá nhiều file. Vui lòng thử lại sau 1 giờ',
      requestId: req.requestId,
      retryAfter: 3600
    });
  },
  skip: (req) => {
    // Skip rate limit for admin users
    return req.user && req.user.isAdmin;
  }
});

/**
 * Rate limiter cho payment endpoints
 * Ngăn spam payment requests
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 payment attempts per hour
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu thanh toán. Vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 [${req.requestId}] Payment rate limit exceeded for IP: ${req.ip}, User: ${req.user?.email}`);
    res.status(429).json({
      success: false,
      message: 'Bạn đã thực hiện quá nhiều giao dịch. Vui lòng thử lại sau 1 giờ',
      requestId: req.requestId,
      retryAfter: 3600
    });
  }
});

/**
 * Rate limiter cho email endpoints (verify, reset password, etc.)
 * Ngăn spam email
 */
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 email requests per hour
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu gửi email. Vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 [${req.requestId}] Email rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Bạn đã gửi quá nhiều email. Vui lòng thử lại sau 1 giờ',
      requestId: req.requestId,
      retryAfter: 3600
    });
  }
});

/**
 * Rate limiter cho review/rating endpoints
 * Ngăn spam reviews
 */
const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Maximum 10 reviews per day
  message: {
    success: false,
    message: 'Quá nhiều đánh giá. Vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 [${req.requestId}] Review rate limit exceeded for IP: ${req.ip}, User: ${req.user?.email}`);
    res.status(429).json({
      success: false,
      message: 'Bạn đã tạo quá nhiều đánh giá. Vui lòng thử lại sau',
      requestId: req.requestId,
      retryAfter: 86400
    });
  }
});

/**
 * Rate limiter cho message/chat endpoints
 * Ngăn spam messages
 */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Maximum 20 messages per minute
  message: {
    success: false,
    message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.log(`🚫 [${req.requestId}] Message rate limit exceeded for User: ${req.user?.email}`);
    res.status(429).json({
      success: false,
      message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút',
      requestId: req.requestId,
      retryAfter: 60
    });
  }
});

/**
 * Lenient rate limiter cho public read-only endpoints
 */
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  registerLimiter,
  uploadLimiter,
  paymentLimiter,
  emailLimiter,
  reviewLimiter,
  messageLimiter,
  publicLimiter
};
