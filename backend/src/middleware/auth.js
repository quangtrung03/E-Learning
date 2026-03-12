const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Xác thực token JWT
const protect = async (req, res, next) => {
  try {
    // 1. Lấy token từ header
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng đăng nhập'
      });
    }
    
    // 2. Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Kiểm tra user còn tồn tại không
    const currentUser = await User.findById(decoded.id).select('+password');
    
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }
    
    // 4. Kiểm tra user có bị khóa không
    if (!currentUser.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // 5. Kiểm tra email đã được xác thực chưa
    if (!currentUser.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng xác thực email trước khi sử dụng',
        requireEmailVerification: true
      });
    }
    
    // 6. Gán user vào request
    req.user = currentUser;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực'
    });
  }
};

// Xác thực token JWT nhưng KHÔNG yêu cầu email verification
// Dùng cho các routes cần authentication nhưng không cần email verified
// Ví dụ: resend verification email, verify email, profile view
const protectWithoutEmailVerification = async (req, res, next) => {
  try {
    // 1. Lấy token từ header
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng đăng nhập'
      });
    }
    
    // 2. Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Kiểm tra user còn tồn tại không
    const currentUser = await User.findById(decoded.id).select('+password');
    
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }
    
    // 4. Kiểm tra user có bị khóa không
    if (!currentUser.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // SKIP email verification check - đây là điểm khác biệt
    
    // 5. Gán user vào request
    req.user = currentUser;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực'
    });
  }
};

// Kiểm tra quyền admin (chỉ admin mới có thể thực hiện một số hành động đặc biệt)
const requireAdmin = (req, res, next) => {
  if (req.user.isAdmin !== true) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền thực hiện hành động này'
    });
  }
  next();
};

// Kiểm tra quyền instructor - thay vì dựa vào role, ta cho phép
// bất kỳ user đã xác thực nào gọi route này. Các controller sẽ
// kiểm tra ownership (ví dụ: course.instructor === req.user.id) khi cần.
const requireInstructor = (req, res, next) => {
  // Nếu muốn giữ admin riêng biệt, controller vẫn có thể check req.user.isAdmin
  return next();
};

// Kiểm tra ownership hoặc admin (cho các tài nguyên cá nhân)
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField] || req.resource?.userId;
    
    // Admin có thể làm mọi thứ
    if (req.user.isAdmin) {
      return next();
    }
    
    // User chỉ có thể làm với tài nguyên của mình
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }
    
    next();
  };
};

// Middleware: Kiểm tra enrollment cho lesson/assignment access
const checkEnrollment = async (req, res, next) => {
  try {
    const Lesson = require('../models/Lesson');
    const Course = require('../models/Course');
    const Enrollment = require('../models/Enrollment');
    
    // Lấy lesson từ params
    const lesson = await Lesson.findById(req.params.id).populate('course');
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }
    
    // Lưu lesson vào req để controller sử dụng (tránh query lại)
    req.lesson = lesson;
    
    // Skip check nếu là instructor của khóa học
    if (lesson.course.instructor.toString() === req.user._id.toString()) {
      return next();
    }
    
    // Skip check nếu là admin
    if (req.user.isAdmin) {
      return next();
    }

    // Chặn học viên truy cập lesson bị ẩn
    if (lesson.isHidden) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }
    
    // Cho phép preview lessons (không cần enrollment)
    if (lesson.isPreview) {
      return next();
    }
    
    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: lesson.course._id,
      status: 'active'
    });
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký khóa học này. Vui lòng đăng ký để truy cập bài học.',
        requireEnrollment: true,
        courseId: lesson.course._id
      });
    }
    
    // Lưu enrollment vào req để controller sử dụng
    req.enrollment = enrollment;
    
    next();
  } catch (error) {
    console.error('Error in checkEnrollment middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra quyền truy cập',
      error: error.message
    });
  }
};

// Optional auth - attaches req.user if token is valid, but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (currentUser && currentUser.isActive) {
      req.user = currentUser;
    }
    next();
  } catch {
    // Token invalid - just continue without user
    next();
  }
};

module.exports = {
  protect,
  protectWithoutEmailVerification,
  requireAdmin,
  requireInstructor,
  requireOwnershipOrAdmin,
  checkEnrollment,
  optionalAuth
};
