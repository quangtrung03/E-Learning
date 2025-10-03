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

module.exports = {
  protect,
  requireAdmin,
  requireOwnershipOrAdmin
};
